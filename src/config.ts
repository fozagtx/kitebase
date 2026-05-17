import { z } from 'zod';

const envSchema = z.object({
  KITE_NETWORK: z.enum(['testnet', 'mainnet']).default('testnet'),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  PORT: z.coerce.number().int().positive().default(3001),

  // Vultr provisioning
  VULTR_API_KEY: z.string().optional(),
  VULTR_REGION: z.string().default('ewr'),
  VULTR_PLAN: z.string().default('vc2-1c-1gb'),
  VULTR_OS_ID: z.coerce.number().int().positive().default(2284),

  // Inference provider for the deployed Hermes agents
  FEATHERLESS_API_KEY: z.string().optional(),
  FEATHERLESS_MODEL: z.string().default('NousResearch/Hermes-3-Llama-3.1-8B'),

  // Kite MCP - per-user API key passed at deploy time, this is the platform default
  KITE_MCP_BASE: z.string().url().default('https://mcp.prod.gokite.ai'),
  KITE_MCP_API_KEY: z.string().optional(),

  // Kitebase platform passport (one Kite EOA, all actors derive from it).
  // Required. Every deployed actor's AA wallet is deterministically derived from
  // this EOA via gokite-aa-sdk salting on (userId, actorName).
  // The actor's DID is did:kite:<KITE_OPERATOR_LABEL>/<actorName>.
  // Generate with:  bun -e "console.log('0x'+require('node:crypto').randomBytes(32).toString('hex'))"
  // Fund the resulting EOA on https://faucet.gokite.ai before going live.
  KITE_OPERATOR_PRIVATE_KEY: z.string().regex(/^0x[a-fA-F0-9]{64}$/),
  KITE_OPERATOR_LABEL: z.string().default('kitebase'),

  // Auth + persistence
  COOKIE_SECRET: z.string().min(16).default('dev-secret-please-change-in-production'),
  COOKIE_NAME: z.string().default('hc_session'),
  DB_PATH: z.string().default('./hermesCloud.sqlite'),
  SESSION_TTL_DAYS: z.coerce.number().int().positive().default(30),

  // Publicly-reachable URL of this control plane. Set this when running
  // somewhere a VPS can reach (e.g. https://kitebase.example.com). When set,
  // each deployed VPS installs a kitebase-sync systemd timer that pulls live
  // config from /v1/agent/config every minute, allowing Telegram tokens etc.
  // to be updated without redeploying. When unset, hot-reload is disabled
  // and channel changes require destroy + redeploy.
  PUBLIC_BASE_URL: z.string().url().optional(),
});

export type AppEnv = z.infer<typeof envSchema>;

let cached: AppEnv | null = null;

export function loadEnv(): AppEnv {
  if (cached) return cached;
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
    throw new Error(`Invalid environment: ${issues}`);
  }
  cached = parsed.data;
  return cached;
}
