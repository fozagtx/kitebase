# Hermes Cloud — Agent Instructions

Project rules for Claude when working in this repo.

## What this is

Managed deployment of NousResearch's open-source **Hermes Agent** on Vultr VPSes, wired into Kite Agent Passport at install time. User fills a form (agent name + optional Telegram bot token + optional Kite MCP key) → control plane provisions a VPS via the Vultr API → cloud-init installs Hermes + writes the agent's secrets + starts the gateway. Each deployed agent gets its own `did:kite:<owner>/<agent>`, AA wallet, channels (Telegram for now), and access to Kite identity/payment tools via `mcp.prod.gokite.ai`.

**Real deploys only. No mocks, no fake "demo" instances. When VULTR_API_KEY isn't set, the deploy endpoint returns the rendered cloud-init script as a preview and refuses to fake a deployment.**

## Stack

- **Runtime**: Bun 1.3+ (native TypeScript, native HTTP via `Bun.serve()`)
- **Web**: Vite + React + Tailwind
- **Chain**: viem (mempool/chain reads), `gokite-aa-sdk` (AA wallet derivation), ethers (peer dep of the AA SDK)
- **Inference for deployed agents**: Featherless OpenAI-compatible API
- **Cloud**: Vultr v2 REST API (`POST /v2/instances` with cloud-init `user_data`)
- **Agent runtime on the VPS**: Hermes Agent from NousResearch (one-line installer, `~/.hermes/.env` for config, `hermes gateway` as systemd service)

## Layout

```
index.html                 Vite entry
vite.config.ts, tailwind.config.js, postcss.config.js
package.json, tsconfig.json, tsconfig.web.json, bunfig.toml

src/
  server.ts                Bun.serve entry + 10s status poller
  routes.ts                request router
  config.ts                zod env (Vultr, Featherless, Kite, etc.)
  logger.ts                structured logger
  types.ts                 Deployment, AgentIdentity, VultrInstanceInfo, request shapes
  store.ts                 in-memory DeploymentStore
  deploy.ts                orchestrator: validate → identity → cloud-init → Vultr → status polling
  vultr.ts                 minimal Vultr v2 API client (createInstance, getInstance, destroyInstance)
  cloudInit.ts             renders the cloud-init bash script run on each new VPS
  kitePassport.ts          derives agent identity (key + ownerAddress + AA wallet + did)
  web/
    main.tsx, App.tsx, index.css, api.ts, types.ts, vite-env.d.ts
    hooks/usePolling.ts
    components/StatusHeader.tsx, DeployForm.tsx, DeploymentCard.tsx
```

## Naming

camelCase for identifiers AND filenames. Never kebab-case or snake_case.

## Code quality

- `bun run typecheck` before considering done — must be clean.
- No `any`. Real types from `./types`.
- No `process.env.X` outside `config.ts`.
- No silent `catch {}` — always log or rethrow.

## Env vars

```
VULTR_API_KEY            required for real deploys; without it the form runs in preview-only mode
VULTR_REGION             default 'ewr'
VULTR_PLAN               default 'vc2-1c-1gb' (~$5/mo)
VULTR_OS_ID              default 2284 (Ubuntu 24.04 LTS x64)
FEATHERLESS_API_KEY      default for deployed agents' inference; can be overridden per deploy
FEATHERLESS_MODEL        default 'NousResearch/Hermes-3-Llama-3.1-8B'
KITE_NETWORK             'testnet' (default) or 'mainnet'
KITE_MCP_BASE            default 'https://mcp.prod.gokite.ai'
KITE_MCP_API_KEY         optional platform-wide default; per-deploy keys override it
PORT                     control-plane port, default 3001
LOG_LEVEL                'debug' | 'info' | 'warn' | 'error', default 'info'
```

## Deploy flow

1. `POST /v1/deployments` with `{ agentName, telegramBotToken?, telegramAllowedUserId?, kiteMcpApiKey? }`
2. Validate. Generate fresh agent identity via `newAgentIdentity()` — random EOA key + deterministic AA wallet via `gokite-aa-sdk` + `did:kite:<owner>/<agentName>`.
3. Render cloud-init via `renderCloudInit()` — bash script that creates a `hermes` user, runs the NousResearch installer, writes secrets to `~/.hermes/.env`, registers the Kite MCP server, installs a systemd unit, starts `hermes gateway`.
4. POST to `https://api.vultr.com/v2/instances` with the cloud-init script base64-encoded as `user_data`. Return the deployment record with status `installing`.
5. The 10s status poller calls `GET /v2/instances/:id` until status is `active` + power_status `running` + server_status `ok`, then flips the deployment to `live`.

## Cloud-init script contract

The script in `cloudInit.ts` is the *interface* between control plane and the running agent. Treat changes carefully — secrets land in `~/.hermes/.env` on the VPS only, never in the control plane store after deployment. The agent's private key is generated fresh per deployment and is the ONLY copy outside the VPS (we keep it in memory so the dashboard can display the AA wallet derivation; persist it to durable storage when we add a real database).

## Anti-patterns

- ❌ Mock Vultr responses or fake instance IDs to "preview" a deploy. If `VULTR_API_KEY` is unset, return the cloud-init preview and refuse to create a record with a fake `instanceId`.
- ❌ Storing the agent's private key anywhere except per-process memory + the target VPS.
- ❌ Hard-coding bundler/RPC/MCP URLs outside `kitePassport.ts`, `cloudInit.ts`, or `config.ts`.
- ❌ `as any`. Use real types.
- ❌ Kebab/snake-case filenames.
- ❌ `Bun.serve()` without `idleTimeout: 0` (we currently don't use SSE here but keep it for parity if we add streaming later).

## Gotchas

- Hermes Agent expects secrets in `~/.hermes/.env` (key=value). Telegram pair: `TELEGRAM_BOT_TOKEN` + `TELEGRAM_ALLOWED_USERS`. Inference: standard OpenAI-style env vars (`OPENAI_API_KEY`, `OPENAI_BASE_URL`, `OPENAI_MODEL`) — Featherless is OpenAI-compatible at `https://api.featherless.ai/v1`.
- Kite MCP URL format: `https://mcp.prod.gokite.ai/api_key_<key>/mcp`. The key is per-user; the platform's default `KITE_MCP_API_KEY` is a fallback when a deployer doesn't supply one.
- The `gokite-aa-sdk` constructor requires a bundler URL. Public bundler today: `https://bundler-service.staging.gokite.ai/rpc/` (note: staging, used for testnet).
- Vultr `user_data` must be base64-encoded — `vultr.ts` handles this for you.
