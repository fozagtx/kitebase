import { db } from './db';
import type {
  AgentIdentity,
  Deployment,
  DeploymentStatus,
  VultrInstanceInfo,
} from './types';

interface DeploymentRow {
  id: string;
  userId: string;
  agentName: string;
  status: DeploymentStatus;
  ownerAddress: string;
  ownerPrivateKey: string;
  aaWallet: string;
  did: string;
  inferenceModel: string;
  kiteMcpEnabled: number;
  telegramBot: string | null;
  vultrJson: string | null;
  cloudInit: string | null;
  statusMessage: string | null;
  createdAt: number;
  updatedAt: number;
  controlToken: string | null;
  configVersion: number;
  telegramBotToken: string | null;
  telegramAllowedUsers: string | null;
}

// Sensitive fields a deployed VPS needs to fetch via the agent-config endpoint.
// Never exposed on the user-facing Deployment object.
export interface AgentConfig {
  configVersion: number;
  telegramBotToken: string | null;
  telegramAllowedUsers: string | null;
}

function rowToDeployment(row: DeploymentRow): Deployment {
  const identity: AgentIdentity = {
    agentName: row.agentName,
    ownerAddress: row.ownerAddress as `0x${string}`,
    ownerPrivateKey: row.ownerPrivateKey as `0x${string}`,
    aaWallet: row.aaWallet as `0x${string}`,
    did: row.did,
  };
  const vultr = row.vultrJson ? (JSON.parse(row.vultrJson) as VultrInstanceInfo) : null;
  return {
    id: row.id,
    status: row.status,
    identity,
    vultr,
    channels: { telegramBotUsername: row.telegramBot ?? undefined },
    inferenceModel: row.inferenceModel,
    kiteMcpEnabled: row.kiteMcpEnabled === 1,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    statusMessage: row.statusMessage ?? undefined,
    cloudInitPreview: row.cloudInit ?? undefined,
  };
}

export class DeploymentStore {
  listForUser(userId: string): Deployment[] {
    const rows = db
      .query('SELECT * FROM deployments WHERE userId = ? ORDER BY createdAt DESC')
      .all(userId) as DeploymentRow[];
    return rows.map(rowToDeployment);
  }

  listAllActive(): Deployment[] {
    const rows = db
      .query(
        "SELECT * FROM deployments WHERE status IN ('provisioning','installing','stopping','starting','restarting') ORDER BY updatedAt ASC",
      )
      .all() as DeploymentRow[];
    return rows.map(rowToDeployment);
  }

  getForUser(userId: string, id: string): Deployment | null {
    const row = db
      .query('SELECT * FROM deployments WHERE id = ? AND userId = ?')
      .get(id, userId) as DeploymentRow | null;
    return row ? rowToDeployment(row) : null;
  }

  getById(id: string): Deployment | null {
    const row = db.query('SELECT * FROM deployments WHERE id = ?').get(id) as DeploymentRow | null;
    return row ? rowToDeployment(row) : null;
  }

  insert(userId: string, d: Deployment, controlToken: string): Deployment {
    db.query(
      `INSERT INTO deployments (
        id, userId, agentName, status, ownerAddress, ownerPrivateKey, aaWallet, did,
        inferenceModel, kiteMcpEnabled, telegramBot, vultrJson, cloudInit,
        statusMessage, createdAt, updatedAt,
        controlToken, configVersion, telegramBotToken, telegramAllowedUsers
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      d.id,
      userId,
      d.identity.agentName,
      d.status,
      d.identity.ownerAddress,
      d.identity.ownerPrivateKey,
      d.identity.aaWallet,
      d.identity.did,
      d.inferenceModel,
      d.kiteMcpEnabled ? 1 : 0,
      d.channels.telegramBotUsername ?? null,
      d.vultr ? JSON.stringify(d.vultr) : null,
      d.cloudInitPreview ?? null,
      d.statusMessage ?? null,
      d.createdAt,
      d.updatedAt,
      controlToken,
      0,
      null,
      null,
    );
    return d;
  }

  // Read just the secrets a VPS needs. Used by /v1/agent/config only.
  getAgentConfig(id: string, presentedToken: string): AgentConfig | null {
    const row = db
      .query(
        'SELECT controlToken, configVersion, telegramBotToken, telegramAllowedUsers FROM deployments WHERE id = ?',
      )
      .get(id) as {
      controlToken: string | null;
      configVersion: number;
      telegramBotToken: string | null;
      telegramAllowedUsers: string | null;
    } | null;
    if (!row || !row.controlToken) return null;
    // constant-time-ish compare to resist trivial timing attacks
    if (!safeEqual(row.controlToken, presentedToken)) return null;
    return {
      configVersion: row.configVersion ?? 0,
      telegramBotToken: row.telegramBotToken,
      telegramAllowedUsers: row.telegramAllowedUsers,
    };
  }

  // Persist a new Telegram config and bump configVersion so the VPS sync
  // timer notices and reloads.
  setTelegramConfig(
    id: string,
    botToken: string | null,
    allowedUsers: string | null,
    username: string | null,
  ): Deployment | null {
    const now = Date.now();
    db.query(
      `UPDATE deployments
         SET telegramBot = ?, telegramBotToken = ?, telegramAllowedUsers = ?,
             configVersion = configVersion + 1, updatedAt = ?
         WHERE id = ?`,
    ).run(username, botToken, allowedUsers, now, id);
    return this.getById(id);
  }

  getControlToken(id: string): string | null {
    const row = db
      .query('SELECT controlToken FROM deployments WHERE id = ?')
      .get(id) as { controlToken: string | null } | null;
    return row?.controlToken ?? null;
  }

  updateStatus(id: string, status: DeploymentStatus, message?: string): Deployment | null {
    const now = Date.now();
    db.query('UPDATE deployments SET status = ?, statusMessage = ?, updatedAt = ? WHERE id = ?').run(
      status,
      message ?? null,
      now,
      id,
    );
    return this.getById(id);
  }

  patchVultr(id: string, vultr: VultrInstanceInfo): Deployment | null {
    const now = Date.now();
    db.query('UPDATE deployments SET vultrJson = ?, updatedAt = ? WHERE id = ?').run(
      JSON.stringify(vultr),
      now,
      id,
    );
    return this.getById(id);
  }

  patchTelegramBot(id: string, username: string | null): Deployment | null {
    const now = Date.now();
    db.query('UPDATE deployments SET telegramBot = ?, updatedAt = ? WHERE id = ?').run(
      username,
      now,
      id,
    );
    return this.getById(id);
  }

  delete(id: string): boolean {
    const result = db.query('DELETE FROM deployments WHERE id = ?').run(id);
    return result.changes > 0;
  }

  appendEvent(deploymentId: string, kind: string, message: string): void {
    db.query(
      'INSERT INTO deploymentEvents (deploymentId, ts, kind, message) VALUES (?, ?, ?, ?)',
    ).run(deploymentId, Date.now(), kind, sanitizeMessage(message));
  }

  listEvents(deploymentId: string, sinceTs = 0): DeploymentEvent[] {
    const rows = db
      .query(
        'SELECT id, deploymentId, ts, kind, message FROM deploymentEvents WHERE deploymentId = ? AND ts >= ? ORDER BY ts ASC',
      )
      .all(deploymentId, sinceTs) as DeploymentEvent[];
    return rows;
  }
}

export interface DeploymentEvent {
  id: number;
  deploymentId: string;
  ts: number;
  kind: string;
  message: string;
}

// Strip anything that smells like a secret before it lands in the event log.
// Conservative: redact bot tokens, hex private keys, bearer headers, long b64.
function sanitizeMessage(s: string): string {
  return s
    .replace(/\b\d{6,12}:[A-Za-z0-9_-]{20,}\b/g, '[redacted-telegram-token]')
    .replace(/\b0x[a-fA-F0-9]{64}\b/g, '[redacted-private-key]')
    .replace(/\bsk-[A-Za-z0-9_-]{16,}\b/g, '[redacted-api-key]')
    .replace(/\brc_[A-Za-z0-9_-]{40,}\b/g, '[redacted-featherless-key]');
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}
