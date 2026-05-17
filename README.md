# kitebase

Deploy AI actors with on-chain identity in one click.

### 🌐 Live demo → **<https://45-63-23-184.nip.io>**

[![live](https://img.shields.io/badge/live-45--63--23--184.nip.io-0074EC?style=flat-square)](https://45-63-23-184.nip.io) [![source](https://img.shields.io/badge/source-fozagtx%2Fkitebase-002259?style=flat-square&logo=github)](https://github.com/fozagtx/kitebase)

Each actor gets its own wallet, identity, and budget. It pays, books, and signs autonomously — on the Kite chain.

## What it is

A control plane that spins up [NousResearch's Hermes Agent](https://github.com/NousResearch/hermes-agent) on Vultr VPSes and wires each new agent into a [Kite Agent Passport](https://docs.gokite.ai) (DID + AA wallet) at install time. Users sign up, click "deploy new actor", and chat with their agent through a Featherless-backed proxy while the VPS provisions in the background. Telegram, Discord, and the other Hermes channels can be wired at deploy or live-hot-reloaded after.

## Stack

| Layer | Choice |
|---|---|
| Runtime | Bun 1.3+ — `Bun.serve()` and `bun:sqlite` |
| Web | Vite + React 18 + Tailwind, bundled into `dist/` and served by Bun in prod |
| Chain | viem (reads), `gokite-aa-sdk` (AA wallet derivation), ethers (peer dep) |
| Inference for deployed actors | Featherless (OpenAI-compatible) |
| Cloud | Vultr v2 REST API (`POST /v2/instances` with cloud-init `user_data`) |
| Actor runtime on the VPS | Hermes Agent + `hermes gateway` systemd unit |
| TLS | Caddy with automatic Let's Encrypt issuance |
| Reachable hostname (no domain needed) | `<ip-with-dashes>.nip.io` |

## Quick start (local dev)

```bash
bun install
cp .env.example .env
# fill VULTR_API_KEY, FEATHERLESS_API_KEY, KITE_OPERATOR_PRIVATE_KEY
bun run dev
```

Web on `http://localhost:3000` (Vite HMR), API on `:3001` (Bun). Vite proxies `/v1/*` to the API. In production, Bun serves both the built UI and the API on a single port.

## Layout

```
src/
  server.ts        Bun.serve entry + 10s Vultr status poller
  routes.ts        request router (API + static SPA fallback)
  config.ts        zod env validation
  store.ts         SQLite-backed deployment store
  deploy.ts        orchestrator: identity -> cloud-init -> Vultr -> polling
  vultr.ts         minimal Vultr v2 client
  cloudInit.ts     cloud-init script renderer for actor VPSes
  kitePassport.ts  one-passport identity derivation (DID + AA wallet)
  web/             React app (Vite-served in dev, dist/-bundled in prod)
scripts/
  deployKitebase.ts  one-shot Vultr deploy of kitebase itself
  printCloudInit.ts  render the bootstrap script for manual fixups
```

## How a deploy works (actor)

1. `POST /v1/deployments` with `{ agentName, telegramBotToken?, telegramAllowedUserId?, kiteMcpApiKey? }`
2. Validate. Mint identity via `newAgentIdentity()` — deterministic AA wallet via `gokite-aa-sdk`, `did:kite:<operatorLabel>/<agentName>`.
3. Render cloud-init: install Hermes via NousResearch's one-liner, write `~/.hermes/.env` with the actor's secrets, register the Kite MCP server (if `KITE_MCP_API_KEY` is provided), install the `hermes` systemd unit, start `hermes gateway`. Also installs a `kitebase-sync` systemd timer that polls `/v1/agent/config` every minute for hot-reloadable channel config.
4. `POST https://api.vultr.com/v2/instances` with the cloud-init script base64-encoded as `user_data`.
5. The 10s status poller calls `GET /v2/instances/:id` until `status=active`, `power=running`, `server=ok`, then flips the deployment to `live`.

## Deploying kitebase itself

```bash
bun scripts/deployKitebase.ts
```

This provisions a fresh Vultr VPS, bootstraps Bun + Caddy + git, clones this repo, builds the UI, writes `/opt/kitebase/.env` with the secrets from your local `.env`, installs systemd units, opens UFW for HTTP/HTTPS, and sets up Caddy with automatic HTTPS on `https://<ip-with-dashes>.nip.io`. The whole boot takes ~3-5 minutes.

If a partial install needs to be patched in place:

```bash
bun scripts/printCloudInit.ts > /tmp/fixup.sh
scp /tmp/fixup.sh root@<ip>:/root/fixup.sh
ssh root@<ip> bash /root/fixup.sh
```

The renderer is idempotent — safe to re-run.

## Telegram hot-reload (no redeploy)

Each VPS installs a `kitebase-sync.timer` systemd unit that polls `https://<kitebase-host>/v1/agent/config?deploymentId=...` every minute, bearer-authed via a per-deployment shared secret minted at deploy time. When you save a new Telegram token in the actor's Identity tab:

1. kitebase persists the token and bumps `configVersion`
2. The VPS notices the bump within ~60s
3. It rewrites the Telegram lines in `~/.hermes/.env` and `systemctl restart hermes`

The control plane must be reachable at `PUBLIC_BASE_URL` for this to work. Without it, the UI gracefully falls back to "destroy + redeploy required" messaging.

## Required env

See `.env.example`. The non-optional ones:

- `KITE_OPERATOR_PRIVATE_KEY` — funded Kite EOA, all actors derive their AA wallets from it
- `VULTR_API_KEY` — for provisioning VPSes
- `FEATHERLESS_API_KEY` — for the bundled inference

`PUBLIC_BASE_URL` is required for Telegram hot-reload but optional for everything else.

## License

Private project.
