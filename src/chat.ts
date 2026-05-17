// Control-plane Featherless proxy so users can talk to their agent before
// the VPS finishes provisioning. The system prompt is shaped to feel like
// the agent's identity. Once the deployed Hermes is reachable on an HTTP
// port we'll swap this proxy to relay there; until then this is the
// always-on chat surface.

import { randomUUID } from 'node:crypto';
import { db } from './db';
import { loadEnv } from './config';
import type { Deployment } from './types';
import { logger } from './logger';

const env = loadEnv();

export interface ChatMessage {
  id: string;
  deploymentId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: number;
}

interface ChatRow {
  id: string;
  deploymentId: string;
  role: string;
  content: string;
  createdAt: number;
}

function rowToMsg(row: ChatRow): ChatMessage {
  return {
    id: row.id,
    deploymentId: row.deploymentId,
    role: row.role as ChatMessage['role'],
    content: row.content,
    createdAt: row.createdAt,
  };
}

export function getChatHistory(deploymentId: string, limit = 50): ChatMessage[] {
  const rows = db
    .query(
      'SELECT * FROM chatMessages WHERE deploymentId = ? ORDER BY createdAt DESC LIMIT ?',
    )
    .all(deploymentId, limit) as ChatRow[];
  return rows.reverse().map(rowToMsg);
}

export interface ActivityBucket {
  date: string;
  user: number;
  assistant: number;
}

interface ActivityRow {
  day: string;
  role: string;
  count: number;
}

export function getActivity(deploymentId: string, days = 14): ActivityBucket[] {
  const now = new Date();
  const start = new Date(now);
  start.setUTCHours(0, 0, 0, 0);
  start.setUTCDate(start.getUTCDate() - (days - 1));
  const startMs = start.getTime();

  const rows = db
    .query(
      `SELECT strftime('%Y-%m-%d', datetime(createdAt / 1000, 'unixepoch')) AS day,
              role,
              COUNT(*) AS count
       FROM chatMessages
       WHERE deploymentId = ? AND createdAt >= ?
       GROUP BY day, role`,
    )
    .all(deploymentId, startMs) as ActivityRow[];

  const byDay = new Map<string, ActivityBucket>();
  for (let i = 0; i < days; i++) {
    const d = new Date(startMs + i * 86_400_000);
    const key = d.toISOString().slice(0, 10);
    byDay.set(key, { date: key, user: 0, assistant: 0 });
  }
  for (const r of rows) {
    const bucket = byDay.get(r.day);
    if (!bucket) continue;
    if (r.role === 'user') bucket.user = r.count;
    else if (r.role === 'assistant') bucket.assistant = r.count;
  }
  return Array.from(byDay.values());
}

function appendChat(
  deploymentId: string,
  role: ChatMessage['role'],
  content: string,
): ChatMessage {
  const msg: ChatMessage = {
    id: randomUUID(),
    deploymentId,
    role,
    content,
    createdAt: Date.now(),
  };
  db.query(
    'INSERT INTO chatMessages (id, deploymentId, role, content, createdAt) VALUES (?, ?, ?, ?, ?)',
  ).run(msg.id, msg.deploymentId, msg.role, msg.content, msg.createdAt);
  return msg;
}

function systemPromptFor(d: Deployment): string {
  return [
    `You are ${d.identity.agentName}, an autonomous Hermes agent deployed on the Kite AI chain.`,
    `Your on-chain DID is ${d.identity.did}.`,
    `Your AA wallet on Kite ${d.identity.aaWallet} can hold funds and pay for x402 services.`,
    `Status of your deployment right now: ${d.status}${d.statusMessage ? ' - ' + d.statusMessage : ''}.`,
    `Be concise, helpful, and honest about what you can and cannot do yet (your VPS may still be provisioning).`,
  ].join(' ');
}

export interface ChatResponse {
  reply: ChatMessage;
  history: ChatMessage[];
}

export async function sendUserMessage(
  d: Deployment,
  userText: string,
): Promise<ChatResponse> {
  appendChat(d.id, 'user', userText);

  const history = getChatHistory(d.id, 30);
  const messages = [
    { role: 'system', content: systemPromptFor(d) },
    ...history.map((m) => ({ role: m.role, content: m.content })),
  ];

  if (!env.FEATHERLESS_API_KEY) {
    const fallback = appendChat(
      d.id,
      'assistant',
      `(no FEATHERLESS_API_KEY configured on the control plane - once it is set, I'll answer via ${d.inferenceModel}.)`,
    );
    return { reply: fallback, history: getChatHistory(d.id) };
  }

  try {
    const res = await fetch('https://api.featherless.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        authorization: `Bearer ${env.FEATHERLESS_API_KEY}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: d.inferenceModel,
        max_tokens: 600,
        messages,
      }),
    });
    if (!res.ok) {
      const body = await res.text();
      logger.warn(
        { status: res.status, body: body.slice(0, 200), model: d.inferenceModel },
        'featherless chat failed',
      );
      const failMsg = appendChat(
        d.id,
        'assistant',
        `(inference error from Featherless: ${res.status} ${body.slice(0, 120)})`,
      );
      return { reply: failMsg, history: getChatHistory(d.id) };
    }
    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const text = data.choices?.[0]?.message?.content?.trim() ?? '(empty response)';
    const reply = appendChat(d.id, 'assistant', text);
    return { reply, history: getChatHistory(d.id) };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.warn({ err: msg }, 'featherless chat threw');
    const failMsg = appendChat(d.id, 'assistant', `(network error: ${msg})`);
    return { reply: failMsg, history: getChatHistory(d.id) };
  }
}
