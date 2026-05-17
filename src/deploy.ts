import { randomBytes, randomUUID } from 'node:crypto';
import type { AppEnv } from './config';
import type { Deployment, DeploymentRequest } from './types';
import { newAgentIdentity } from './kitePassport';
import { renderCloudInit } from './cloudInit';
import {
  createInstance,
  destroyInstance,
  getInstance,
  haltInstance,
  rebootInstance,
  startVultrInstance,
  VultrError,
} from './vultr';
import { logger } from './logger';
import type { DeploymentStore } from './store';

export function validate(req: DeploymentRequest): { ok: true } | { ok: false; reason: string } {
  if (!req.agentName || typeof req.agentName !== 'string') {
    return { ok: false, reason: 'agentName is required' };
  }
  if (!/^[a-zA-Z0-9_\- ]{2,40}$/.test(req.agentName)) {
    return { ok: false, reason: 'agentName must be 2-40 chars: letters, digits, space, _ or -' };
  }
  if (req.telegramBotToken && !/^\d+:[A-Za-z0-9_-]{20,}$/.test(req.telegramBotToken)) {
    return { ok: false, reason: 'telegramBotToken does not look like a BotFather token' };
  }
  return { ok: true };
}

export async function startDeployment(
  env: AppEnv,
  store: DeploymentStore,
  userId: string,
  request: DeploymentRequest,
): Promise<Deployment> {
  const identity = newAgentIdentity(env, request.agentName, userId);
  const id = randomUUID();
  const controlToken = randomBytes(32).toString('hex');
  const cloudInit = renderCloudInit({
    env,
    identity,
    request,
    deploymentId: id,
    controlToken,
  });
  const now = Date.now();

  const initial: Deployment = {
    id,
    status: 'pending',
    identity,
    vultr: null,
    channels: { telegramBotUsername: undefined },
    inferenceModel: request.inferenceModel ?? env.FEATHERLESS_MODEL,
    kiteMcpEnabled: !!(request.kiteMcpApiKey ?? env.KITE_MCP_API_KEY),
    createdAt: now,
    updatedAt: now,
    statusMessage: undefined,
    cloudInitPreview: cloudInit,
  };
  store.insert(userId, initial, controlToken);
  store.appendEvent(
    id,
    'identity',
    `Minted ${identity.did} with AA wallet ${identity.aaWallet}`,
  );

  if (!env.VULTR_API_KEY) {
    return (
      store.updateStatus(
        id,
        'pending',
        'VULTR_API_KEY not set - cloud-init prepared, set the key to actually provision. Chat works now via the control-plane Featherless proxy.',
      ) ?? initial
    );
  }

  try {
    store.updateStatus(id, 'provisioning', 'calling Vultr API…');
    store.appendEvent(id, 'deploy', 'Provisioning a Vultr VPS for this actor…');
    const safeHostname =
      `kite-agent-${identity.agentName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`.slice(0, 60);
    const instance = await createInstance(env, {
      region: env.VULTR_REGION,
      plan: env.VULTR_PLAN,
      osId: env.VULTR_OS_ID,
      label: `hermes-${identity.agentName}`.slice(0, 60),
      hostname: safeHostname,
      userData: cloudInit,
      tags: ['hermes-cloud', `agent:${identity.agentName.toLowerCase()}`.slice(0, 60)],
    });
    logger.info({ id, vultrId: instance.instanceId }, 'vultr instance created');
    store.patchVultr(id, instance);
    store.appendEvent(id, 'vultr', `Vultr instance created (${instance.instanceId})`);
    // The instance is queued at this point - Vultr still reports status=pending
    // until the VPS finishes booting. Keep us at 'provisioning' and let
    // tickStatus flip to 'installing' once Vultr says status=active.
    return (
      store.updateStatus(id, 'provisioning', 'Vultr accepted the order, allocating instance…') ??
      initial
    );
  } catch (err) {
    if (err instanceof VultrError) {
      logger.warn({ id, status: err.status, body: err.body }, 'vultr provision failed');
      return (
        store.updateStatus(
          id,
          'failed',
          `Vultr error ${err.status}: ${JSON.stringify(err.body).slice(0, 200)}`,
        ) ?? initial
      );
    }
    const msg = err instanceof Error ? err.message : String(err);
    logger.error({ id, err: msg }, 'deploy failed');
    return store.updateStatus(id, 'failed', msg) ?? initial;
  }
}

export async function tickStatus(env: AppEnv, store: DeploymentStore): Promise<void> {
  if (!env.VULTR_API_KEY) return;
  const active = store.listAllActive();
  for (const d of active) {
    if (!d.vultr) continue;
    try {
      const info = await getInstance(env, d.vultr.instanceId);
      store.patchVultr(d.id, info);

      const isRunning =
        info.status === 'active' && info.powerStatus === 'running' && info.serverStatus === 'ok';
      // Only treat as halted when Vultr considers the instance fully
      // provisioned AND power is off. During the boot/install window
      // powerStatus can briefly be 'stopped' even though nobody halted it -
      // that previously bounced us into 'stopped: VPS halted' incorrectly.
      const isFullyHalted = info.status === 'active' && info.powerStatus === 'stopped';

      let next: import('./types').DeploymentStatus;
      let msg: string;

      if (isRunning) {
        next = 'live';
        msg =
          d.status === 'starting' || d.status === 'restarting'
            ? 'back online'
            : 'Hermes Agent installed and running';
      } else if (d.status === 'stopping' && isFullyHalted) {
        next = 'stopped';
        msg = 'VPS halted';
      } else if (d.status === 'stopping') {
        next = 'stopping';
        msg = `Vultr: power=${info.powerStatus}`;
      } else if (d.status === 'starting' || d.status === 'restarting') {
        next = d.status;
        msg = `Vultr: power=${info.powerStatus} · server=${info.serverStatus}`;
      } else if (d.status === 'live' && isFullyHalted) {
        // Live actor whose VPS got halted externally (out-of-band Vultr ops)
        next = 'stopped';
        msg = 'VPS halted (external)';
      } else if (info.status === 'pending') {
        // Vultr is still allocating the box
        next = 'provisioning';
        msg = 'Vultr: allocating instance…';
      } else if (info.status === 'active') {
        // Box is up; either cloud-init is still installing Hermes, or it
        // hasn't reported server=ok yet. Keep at 'installing'.
        next = 'installing';
        msg = `Vultr: active · power=${info.powerStatus} · server=${info.serverStatus}`;
      } else {
        // Any other Vultr lifecycle state (e.g. 'resizing'). Keep our state.
        next = d.status;
        msg = `Vultr: ${info.status} · power=${info.powerStatus}`;
      }

      if (next !== d.status) {
        store.appendEvent(
          d.id,
          'status',
          `${d.status} → ${next}${msg ? `: ${msg}` : ''}`,
        );
      }
      store.updateStatus(d.id, next, msg);
    } catch (err) {
      logger.warn(
        { id: d.id, err: err instanceof Error ? err.message : String(err) },
        'status poll failed',
      );
      store.appendEvent(
        d.id,
        'error',
        `status poll failed: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }
}

export async function haltDeployment(
  env: AppEnv,
  store: DeploymentStore,
  userId: string,
  id: string,
): Promise<{ ok: boolean; reason?: string }> {
  const d = store.getForUser(userId, id);
  if (!d) return { ok: false, reason: 'not found' };
  if (!d.vultr) return { ok: false, reason: 'no VPS to halt' };
  if (!env.VULTR_API_KEY) return { ok: false, reason: 'VULTR_API_KEY not set' };
  try {
    await haltInstance(env, d.vultr.instanceId);
    store.updateStatus(id, 'stopping', 'halt requested');
    return { ok: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.warn({ id, err: msg }, 'halt failed');
    return { ok: false, reason: msg };
  }
}

export async function startVultrDeployment(
  env: AppEnv,
  store: DeploymentStore,
  userId: string,
  id: string,
): Promise<{ ok: boolean; reason?: string }> {
  const d = store.getForUser(userId, id);
  if (!d) return { ok: false, reason: 'not found' };
  if (!d.vultr) return { ok: false, reason: 'no VPS to start' };
  if (!env.VULTR_API_KEY) return { ok: false, reason: 'VULTR_API_KEY not set' };
  try {
    await startVultrInstance(env, d.vultr.instanceId);
    store.updateStatus(id, 'starting', 'start requested');
    return { ok: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.warn({ id, err: msg }, 'start failed');
    return { ok: false, reason: msg };
  }
}

export async function restartDeployment(
  env: AppEnv,
  store: DeploymentStore,
  userId: string,
  id: string,
): Promise<{ ok: boolean; reason?: string }> {
  const d = store.getForUser(userId, id);
  if (!d) return { ok: false, reason: 'not found' };
  if (!d.vultr) return { ok: false, reason: 'no VPS to restart' };
  if (!env.VULTR_API_KEY) return { ok: false, reason: 'VULTR_API_KEY not set' };
  try {
    await rebootInstance(env, d.vultr.instanceId);
    store.updateStatus(id, 'restarting', 'restart requested');
    return { ok: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.warn({ id, err: msg }, 'restart failed');
    return { ok: false, reason: msg };
  }
}

export async function destroyDeployment(
  env: AppEnv,
  store: DeploymentStore,
  userId: string,
  id: string,
): Promise<boolean> {
  const d = store.getForUser(userId, id);
  if (!d) return false;
  if (d.vultr && env.VULTR_API_KEY) {
    try {
      await destroyInstance(env, d.vultr.instanceId);
    } catch (err) {
      logger.warn(
        { id, err: err instanceof Error ? err.message : String(err) },
        'vultr destroy failed (continuing)',
      );
    }
  }
  store.updateStatus(id, 'destroyed', 'instance destroyed');
  return true;
}
