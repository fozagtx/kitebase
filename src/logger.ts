import { loadEnv } from './config';

type Level = 'debug' | 'info' | 'warn' | 'error';
const order: Record<Level, number> = { debug: 0, info: 1, warn: 2, error: 3 };

const colors: Record<Level, string> = {
  debug: '\x1b[90m',
  info: '\x1b[36m',
  warn: '\x1b[33m',
  error: '\x1b[31m',
};
const reset = '\x1b[0m';
const dim = '\x1b[2m';

const env = loadEnv();
const threshold = order[env.LOG_LEVEL];
const isTTY = process.stdout.isTTY;

function fmt(level: Level, ctx: Record<string, unknown> | undefined, msg: string): string {
  const ts = new Date().toISOString().slice(11, 19);
  if (!isTTY) return JSON.stringify({ ts, level, msg, ...(ctx ?? {}) });
  const ctxStr = ctx
    ? Object.entries(ctx)
        .map(([k, v]) => `${dim}${k}=${reset}${typeof v === 'string' ? v : JSON.stringify(v)}`)
        .join(' ')
    : '';
  return `${dim}${ts}${reset} ${colors[level]}${level.padEnd(5)}${reset} ${msg}${ctxStr ? ' ' + ctxStr : ''}`;
}

function log(level: Level, ctx: Record<string, unknown> | undefined, msg: string) {
  if (order[level] < threshold) return;
  const line = fmt(level, ctx, msg);
  if (level === 'error' || level === 'warn') console.error(line);
  else console.log(line);
}

export const logger = {
  debug: (ctx: Record<string, unknown> | string, msg?: string) =>
    typeof ctx === 'string' ? log('debug', undefined, ctx) : log('debug', ctx, msg ?? ''),
  info: (ctx: Record<string, unknown> | string, msg?: string) =>
    typeof ctx === 'string' ? log('info', undefined, ctx) : log('info', ctx, msg ?? ''),
  warn: (ctx: Record<string, unknown> | string, msg?: string) =>
    typeof ctx === 'string' ? log('warn', undefined, ctx) : log('warn', ctx, msg ?? ''),
  error: (ctx: Record<string, unknown> | string, msg?: string) =>
    typeof ctx === 'string' ? log('error', undefined, ctx) : log('error', ctx, msg ?? ''),
};
