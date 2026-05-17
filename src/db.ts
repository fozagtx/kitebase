import { Database } from 'bun:sqlite';
import { loadEnv } from './config';

const env = loadEnv();

export const db = new Database(env.DB_PATH);
db.exec('PRAGMA journal_mode = WAL');
db.exec('PRAGMA foreign_keys = ON');

// idempotent migrations — add columns on older DBs
function ensureColumn(table: string, column: string, def: string): void {
  const cols = db
    .query<{ name: string }, []>(`PRAGMA table_info(${table})`)
    .all() as { name: string }[];
  if (!cols.some((c) => c.name === column)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${def}`);
  }
}

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id            TEXT PRIMARY KEY,
  email         TEXT NOT NULL UNIQUE,
  passwordHash  TEXT NOT NULL,
  kiteAddress   TEXT,
  createdAt     INTEGER NOT NULL,
  updatedAt     INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  id        TEXT PRIMARY KEY,
  userId    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expiresAt INTEGER NOT NULL,
  createdAt INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS sessions_userId ON sessions(userId);

CREATE TABLE IF NOT EXISTS deployments (
  id              TEXT PRIMARY KEY,
  userId          TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  agentName       TEXT NOT NULL,
  status          TEXT NOT NULL,
  ownerAddress    TEXT NOT NULL,
  ownerPrivateKey TEXT NOT NULL,
  aaWallet        TEXT NOT NULL,
  did             TEXT NOT NULL,
  inferenceModel  TEXT NOT NULL,
  kiteMcpEnabled  INTEGER NOT NULL,
  telegramBot     TEXT,
  vultrJson       TEXT,
  cloudInit       TEXT,
  statusMessage   TEXT,
  createdAt       INTEGER NOT NULL,
  updatedAt       INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS deployments_userId ON deployments(userId);

CREATE TABLE IF NOT EXISTS chatMessages (
  id           TEXT PRIMARY KEY,
  deploymentId TEXT NOT NULL REFERENCES deployments(id) ON DELETE CASCADE,
  role         TEXT NOT NULL,
  content      TEXT NOT NULL,
  createdAt    INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS chatMessages_deploymentId ON chatMessages(deploymentId);

CREATE TABLE IF NOT EXISTS deploymentEvents (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  deploymentId TEXT NOT NULL REFERENCES deployments(id) ON DELETE CASCADE,
  ts           INTEGER NOT NULL,
  kind         TEXT NOT NULL,
  message      TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS deploymentEvents_deploymentId ON deploymentEvents(deploymentId, ts);
`);

// Channel hot-reload: VPS polls /v1/agent/config with a shared bearer token,
// pulls the latest channel config, and restarts hermes when configVersion bumps.
ensureColumn('deployments', 'controlToken', 'TEXT');
ensureColumn('deployments', 'configVersion', 'INTEGER NOT NULL DEFAULT 0');
ensureColumn('deployments', 'telegramBotToken', 'TEXT');
ensureColumn('deployments', 'telegramAllowedUsers', 'TEXT');

