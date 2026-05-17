import { randomUUID, createHmac, timingSafeEqual } from 'node:crypto';
import { db } from './db';
import { loadEnv } from './config';
import { createUser, getUserByEmail, getUserById, type User } from './users';
import { logger } from './logger';

const env = loadEnv();

export interface Session {
  id: string;
  userId: string;
  expiresAt: number;
  createdAt: number;
}

interface SessionRow {
  id: string;
  userId: string;
  expiresAt: number;
  createdAt: number;
}

function sign(token: string): string {
  return createHmac('sha256', env.COOKIE_SECRET).update(token).digest('hex');
}

function pack(token: string): string {
  return `${token}.${sign(token)}`;
}

function unpack(cookie: string): string | null {
  const idx = cookie.lastIndexOf('.');
  if (idx <= 0) return null;
  const token = cookie.slice(0, idx);
  const provided = cookie.slice(idx + 1);
  const expected = sign(token);
  if (provided.length !== expected.length) return null;
  if (!timingSafeEqual(Buffer.from(provided), Buffer.from(expected))) return null;
  return token;
}

export interface SignupResult {
  ok: boolean;
  user?: User;
  cookie?: string;
  error?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function signup(email: string, password: string): Promise<SignupResult> {
  if (!EMAIL_RE.test(email)) return { ok: false, error: 'invalid email' };
  if (typeof password !== 'string' || password.length < 8) {
    return { ok: false, error: 'password must be at least 8 characters' };
  }
  if (getUserByEmail(email)) return { ok: false, error: 'email already registered' };
  const passwordHash = await Bun.password.hash(password, { algorithm: 'bcrypt', cost: 10 });
  const user = createUser(email, passwordHash);
  const cookie = createSessionCookie(user.id);
  return { ok: true, user, cookie };
}

export async function login(email: string, password: string): Promise<SignupResult> {
  const user = getUserByEmail(email);
  if (!user) return { ok: false, error: 'invalid credentials' };
  const valid = await Bun.password.verify(password, user.passwordHash);
  if (!valid) return { ok: false, error: 'invalid credentials' };
  const cookie = createSessionCookie(user.id);
  return { ok: true, user, cookie };
}

export function createSessionCookie(userId: string): string {
  const id = randomUUID();
  const now = Date.now();
  const expiresAt = now + env.SESSION_TTL_DAYS * 86_400_000;
  db.query(
    'INSERT INTO sessions (id, userId, expiresAt, createdAt) VALUES (?, ?, ?, ?)',
  ).run(id, userId, expiresAt, now);
  const value = pack(id);
  const ttlSec = Math.floor((expiresAt - now) / 1000);
  return `${env.COOKIE_NAME}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${ttlSec}`;
}

export function clearSessionCookie(): string {
  return `${env.COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}

export function userFromRequest(req: Request): User | null {
  const cookieHeader = req.headers.get('cookie');
  if (!cookieHeader) return null;
  const cookies = parseCookies(cookieHeader);
  const raw = cookies[env.COOKIE_NAME];
  if (!raw) return null;
  const sessionId = unpack(raw);
  if (!sessionId) return null;
  const row = db.query('SELECT * FROM sessions WHERE id = ?').get(sessionId) as SessionRow | null;
  if (!row) return null;
  if (row.expiresAt < Date.now()) {
    db.query('DELETE FROM sessions WHERE id = ?').run(sessionId);
    return null;
  }
  const user = getUserById(row.userId);
  if (!user) {
    db.query('DELETE FROM sessions WHERE id = ?').run(sessionId);
    return null;
  }
  return user;
}

export function logoutFromRequest(req: Request): void {
  const cookieHeader = req.headers.get('cookie');
  if (!cookieHeader) return;
  const cookies = parseCookies(cookieHeader);
  const raw = cookies[env.COOKIE_NAME];
  if (!raw) return;
  const sessionId = unpack(raw);
  if (!sessionId) return;
  db.query('DELETE FROM sessions WHERE id = ?').run(sessionId);
  logger.debug({ sessionId: sessionId.slice(0, 8) }, 'session destroyed');
}

function parseCookies(header: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const part of header.split(';')) {
    const idx = part.indexOf('=');
    if (idx <= 0) continue;
    const k = part.slice(0, idx).trim();
    const v = part.slice(idx + 1).trim();
    if (k) out[k] = v;
  }
  return out;
}
