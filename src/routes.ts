import type { AppEnv } from './config';
import type { DeploymentRequest } from './types';
import type { DeploymentStore } from './store';
import {
  destroyDeployment,
  haltDeployment,
  restartDeployment,
  startDeployment,
  startVultrDeployment,
  validate,
} from './deploy';
import { renderCloudInit } from './cloudInit';
import { newAgentIdentity } from './kitePassport';
import {
  clearSessionCookie,
  login,
  logoutFromRequest,
  signup,
  userFromRequest,
} from './auth';
import { setUserKiteAddress } from './users';
import { getActivity, getChatHistory, sendUserMessage } from './chat';

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'content-type',
  'Access-Control-Allow-Credentials': 'true',
};

function json(data: unknown, init: ResponseInit = {}, extraHeaders: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      ...CORS_HEADERS,
      ...extraHeaders,
      ...(init.headers ?? {}),
    },
  });
}

export interface RouterDeps {
  env: AppEnv;
  store: DeploymentStore;
}

export function createRouter(deps: RouterDeps): (req: Request) => Promise<Response> {
  const { env, store } = deps;

  return async (req: Request): Promise<Response> => {
    const url = new URL(req.url);
    const { pathname } = url;
    const method = req.method.toUpperCase();

    if (method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS_HEADERS });

    if (method === 'GET' && pathname === '/v1/health') {
      return json({
        ok: true,
        network: env.KITE_NETWORK,
        vultrConfigured: !!env.VULTR_API_KEY,
        featherlessConfigured: !!env.FEATHERLESS_API_KEY,
        kiteMcpConfigured: !!env.KITE_MCP_API_KEY,
        passportLabel: env.KITE_OPERATOR_LABEL,
        liveReloadEnabled: !!env.PUBLIC_BASE_URL,
        uptimeMs: process.uptime() * 1000,
      });
    }

    // ---- Agent-side config sync (called by kitebase-sync on the VPS) ----
    // Auth is a per-deployment shared secret minted at deploy time and
    // burned into cloud-init. NOT a user session.
    if (method === 'GET' && pathname === '/v1/agent/config') {
      const deploymentId = url.searchParams.get('deploymentId');
      const authz = req.headers.get('authorization') ?? '';
      const m = /^Bearer\s+(.+)$/i.exec(authz.trim());
      if (!deploymentId || !m) {
        return json({ error: 'unauthorized' }, { status: 401 });
      }
      const cfg = store.getAgentConfig(deploymentId, m[1]!.trim());
      if (!cfg) {
        return json({ error: 'unauthorized' }, { status: 401 });
      }
      return json(cfg);
    }

    // ---- Auth ----------------------------------------------------------
    if (method === 'POST' && pathname === '/v1/auth/signup') {
      let body: { email?: string; password?: string };
      try {
        body = (await req.json()) as { email?: string; password?: string };
      } catch {
        return json({ error: 'invalid json' }, { status: 400 });
      }
      const result = await signup(body.email ?? '', body.password ?? '');
      if (!result.ok || !result.user || !result.cookie) {
        return json({ error: result.error ?? 'signup failed' }, { status: 400 });
      }
      return json({ user: publicUser(result.user) }, { status: 201 }, { 'set-cookie': result.cookie });
    }

    if (method === 'POST' && pathname === '/v1/auth/login') {
      let body: { email?: string; password?: string };
      try {
        body = (await req.json()) as { email?: string; password?: string };
      } catch {
        return json({ error: 'invalid json' }, { status: 400 });
      }
      const result = await login(body.email ?? '', body.password ?? '');
      if (!result.ok || !result.user || !result.cookie) {
        return json({ error: result.error ?? 'login failed' }, { status: 401 });
      }
      return json({ user: publicUser(result.user) }, { status: 200 }, { 'set-cookie': result.cookie });
    }

    if (method === 'POST' && pathname === '/v1/auth/logout') {
      logoutFromRequest(req);
      return json({ ok: true }, { status: 200 }, { 'set-cookie': clearSessionCookie() });
    }

    const me = userFromRequest(req);

    if (method === 'GET' && pathname === '/v1/auth/me') {
      if (!me) return json({ user: null });
      return json({ user: publicUser(me) });
    }

    // ---- Authed routes below -------------------------------------------
    if (!me) {
      return json({ error: 'authentication required' }, { status: 401 });
    }

    if (method === 'POST' && pathname === '/v1/user/kiteAddress') {
      let body: { address?: string };
      try {
        body = (await req.json()) as { address?: string };
      } catch {
        return json({ error: 'invalid json' }, { status: 400 });
      }
      const addr = (body.address ?? '').trim();
      if (addr && !/^0x[a-fA-F0-9]{40}$/.test(addr)) {
        return json({ error: 'invalid address' }, { status: 400 });
      }
      const updated = setUserKiteAddress(me.id, addr || null);
      return json({ user: updated ? publicUser(updated) : null });
    }

    if (method === 'GET' && pathname === '/v1/deployments') {
      return json({ items: store.listForUser(me.id) });
    }

    if (method === 'POST' && pathname === '/v1/deployments') {
      let body: DeploymentRequest;
      try {
        body = (await req.json()) as DeploymentRequest;
      } catch {
        return json({ error: 'invalid json body' }, { status: 400 });
      }
      const check = validate(body);
      if (!check.ok) return json({ error: check.reason }, { status: 400 });
      const d = await startDeployment(env, store, me.id, body);
      return json(d, { status: 201 });
    }

    const idMatch = pathname.match(
      /^\/v1\/deployments\/([0-9a-f-]{36})(\/chat|\/activity|\/halt|\/start|\/restart|\/events|\/telegram)?$/,
    );
    if (idMatch) {
      const id = idMatch[1]!;
      const sub = idMatch[2];
      const d = store.getForUser(me.id, id);
      if (!d) return json({ error: 'not found' }, { status: 404 });

      if (!sub && method === 'GET') return json(d);
      if (!sub && method === 'DELETE') {
        const ok = await destroyDeployment(env, store, me.id, id);
        return json({ ok }, { status: ok ? 200 : 404 });
      }

      if (sub === '/halt' && method === 'POST') {
        const r = await haltDeployment(env, store, me.id, id);
        return json(r, { status: r.ok ? 200 : 400 });
      }
      if (sub === '/start' && method === 'POST') {
        const r = await startVultrDeployment(env, store, me.id, id);
        return json(r, { status: r.ok ? 200 : 400 });
      }
      if (sub === '/restart' && method === 'POST') {
        const r = await restartDeployment(env, store, me.id, id);
        return json(r, { status: r.ok ? 200 : 400 });
      }

      if (sub === '/events' && method === 'GET') {
        const since = Number(url.searchParams.get('since') ?? '0');
        return json({ events: store.listEvents(id, Number.isFinite(since) ? since : 0) });
      }

      if (sub === '/telegram' && method === 'POST') {
        let body: { botToken?: string | null; allowedUserId?: string | null };
        try {
          body = (await req.json()) as typeof body;
        } catch {
          return json({ error: 'invalid json' }, { status: 400 });
        }
        const token = (body.botToken ?? '').toString().trim();
        if (token && !/^\d+:[A-Za-z0-9_-]{20,}$/.test(token)) {
          return json({ error: 'token does not look like a BotFather token' }, { status: 400 });
        }
        const allowedRaw = (body.allowedUserId ?? '').toString().trim();
        const allowed = allowedRaw || null;
        const username = token ? `bot${token.split(':')[0]}` : null;

        // Persist token + allowed users + bump configVersion. The kitebase-sync
        // timer on the VPS polls /v1/agent/config every minute, notices the
        // version bump, rewrites ~/.hermes/.env, and restarts hermes.
        store.setTelegramConfig(id, token || null, allowed, username);

        const liveReload = !!env.PUBLIC_BASE_URL;
        store.appendEvent(
          id,
          'telegram',
          token
            ? liveReload
              ? `telegram token saved (${username}). Live within ~60s on the VPS.`
              : `telegram token saved (${username}). Hot-reload disabled (PUBLIC_BASE_URL unset) - redeploy required.`
            : 'telegram token cleared',
        );
        return json({
          ok: true,
          telegramBotUsername: username,
          liveReloadEnabled: liveReload,
        });
      }

      if (sub === '/chat' && method === 'GET') {
        return json({ messages: getChatHistory(id) });
      }
      if (sub === '/chat' && method === 'POST') {
        let body: { text?: string };
        try {
          body = (await req.json()) as { text?: string };
        } catch {
          return json({ error: 'invalid json' }, { status: 400 });
        }
        const text = (body.text ?? '').trim();
        if (!text) return json({ error: 'text required' }, { status: 400 });
        const out = await sendUserMessage(d, text);
        return json(out);
      }

      if (sub === '/activity' && method === 'GET') {
        const daysParam = Number(url.searchParams.get('days') ?? '14');
        const days = Number.isFinite(daysParam)
          ? Math.min(Math.max(Math.trunc(daysParam), 1), 90)
          : 14;
        return json({ buckets: getActivity(id, days) });
      }
    }

    if (method === 'POST' && pathname === '/v1/preview') {
      let body: DeploymentRequest;
      try {
        body = (await req.json()) as DeploymentRequest;
      } catch {
        return json({ error: 'invalid json body' }, { status: 400 });
      }
      const check = validate(body);
      if (!check.ok) return json({ error: check.reason }, { status: 400 });
      const identity = newAgentIdentity(env, body.agentName, me.id);
      const cloudInit = renderCloudInit({
        env,
        identity,
        request: body,
        deploymentId: '00000000-0000-0000-0000-000000000000',
        controlToken: '<preview-only-not-a-real-token>',
      });
      return json({
        identity: {
          agentName: identity.agentName,
          ownerAddress: identity.ownerAddress,
          aaWallet: identity.aaWallet,
          did: identity.did,
        },
        cloudInitPreview: cloudInit,
        note: 'Preview - throwaway identity, not stored.',
      });
    }

    return json({ error: 'not found' }, { status: 404 });
  };
}

function publicUser(u: { id: string; email: string; kiteAddress: string | null; createdAt: number }) {
  return {
    id: u.id,
    email: u.email,
    kiteAddress: u.kiteAddress,
    createdAt: u.createdAt,
  };
}
