# kitebase

Deploy AI actors with on-chain identity in one click. Hermes runtime, Kite Agent Passport, and Featherless inference — all wired at install time.

## What it is

A control plane that provisions [NousResearch's Hermes Agent](https://github.com/NousResearch/hermes-agent) on Vultr VPSes and wires each new agent into a [Kite Agent Passport](https://docs.gokite.ai) (DID + AA wallet) at install time. Users sign up with email + password, click "deploy new actor", and chat with their agent through a Featherless-backed proxy while the VPS provisions in the background.

## Stack

- **Runtime**: Bun 1.3+ (native HTTP via `Bun.serve()`, `bun:sqlite` for persistence)
- **Web**: Vite + React 18 + Tailwind
- **Chain**: viem (chain reads), `gokite-aa-sdk` (AA wallet derivation), ethers (peer dep)
- **Inference for deployed agents**: Featherless (OpenAI-compatible)
- **Cloud**: Vultr v2 REST API (`POST /v2/instances` with cloud-init `user_data`)
- **Agent runtime on the VPS**: Hermes Agent (one-line installer, `~/.hermes/.env` for config, `hermes gateway` as a systemd service)

## Quick start

```bash
bun install
cp .env.example .env
# fill in VULTR_API_KEY, FEATHERLESS_API_KEY, KITE_OPERATOR_PRIVATE_KEY
bun run dev
```

Web on `http://localhost:3000`, API on `:3001`.

## Layout

```
src/
  server.ts        Bun.serve entry + 10s status poller
  routes.ts        request router
  config.ts        zod env (Vultr, Featherless, Kite, etc.)
  store.ts         SQLite-backed deployment store
  deploy.ts        orchestrator: validate → identity → cloud-init → Vultr → polling
  vultr.ts         minimal Vultr v2 API client
  cloudInit.ts     renders the cloud-init bash script run on each new VPS
  kitePassport.ts  derives agent identity (key + AA wallet + did)
  web/             React app (Vite-served in dev)
```

## How a deploy works

1. `POST /v1/deployments` with `{ agentName, telegramBotToken?, telegramAllowedUserId?, kiteMcpApiKey? }`
2. Validate. Mint a fresh agent identity via `newAgentIdentity()` — random EOA key (or platform-passport derivation) + deterministic AA wallet via `gokite-aa-sdk` + `did:kite:<owner>/<agentName>`.
3. Render cloud-init via `renderCloudInit()` — bash script that installs the NousResearch Hermes installer, writes secrets to `~/.hermes/.env`, registers the Kite MCP server, installs a systemd unit, starts `hermes gateway`.
4. POST to `https://api.vultr.com/v2/instances` with the cloud-init script base64-encoded as `user_data`. Return the deployment record with status `provisioning`.
5. A 10s poller calls `GET /v2/instances/:id` until status is `active` + power=`running` + server=`ok`, then flips the deployment to `live`.

## License

Private project. Not for redistribution.
