import { randomUUID } from 'node:crypto';
import { db } from './db';

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  kiteAddress: string | null;
  createdAt: number;
  updatedAt: number;
}

interface UserRow {
  id: string;
  email: string;
  passwordHash: string;
  kiteAddress: string | null;
  createdAt: number;
  updatedAt: number;
}

function rowToUser(row: UserRow): User {
  return {
    id: row.id,
    email: row.email,
    passwordHash: row.passwordHash,
    kiteAddress: row.kiteAddress,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function getUserById(id: string): User | null {
  const row = db.query('SELECT * FROM users WHERE id = ?').get(id) as UserRow | null;
  return row ? rowToUser(row) : null;
}

export function getUserByEmail(email: string): User | null {
  const row = db.query('SELECT * FROM users WHERE email = ?').get(email.toLowerCase()) as UserRow | null;
  return row ? rowToUser(row) : null;
}

export function createUser(email: string, passwordHash: string): User {
  const id = randomUUID();
  const now = Date.now();
  db.query(
    'INSERT INTO users (id, email, passwordHash, kiteAddress, createdAt, updatedAt) VALUES (?, ?, ?, NULL, ?, ?)',
  ).run(id, email.toLowerCase(), passwordHash, now, now);
  return { id, email: email.toLowerCase(), passwordHash, kiteAddress: null, createdAt: now, updatedAt: now };
}

export function setUserKiteAddress(userId: string, kiteAddress: string | null): User | null {
  const now = Date.now();
  db.query('UPDATE users SET kiteAddress = ?, updatedAt = ? WHERE id = ?').run(
    kiteAddress,
    now,
    userId,
  );
  return getUserById(userId);
}
