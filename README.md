# kitebase

Deploy AI actors with on-chain identity in one click.

### 🌐 Live demo → **<https://kitebase.zanbuilds.workers.dev>**

[![live](https://img.shields.io/badge/live-kitebase.zanbuilds.workers.dev-0074EC?style=flat-square)](https://kitebase.zanbuilds.workers.dev) [![source](https://img.shields.io/badge/source-fozagtx%2Fkitebase-002259?style=flat-square&logo=github)](https://github.com/fozagtx/kitebase) [![kite](https://img.shields.io/badge/built%20on-Kite%20chain-002259?style=flat-square)](https://gokite.ai)

Each actor gets its own **Kite Agent Passport** — a `did:kite` identity, an AA wallet derived via `gokite-aa-sdk`, and the runtime, channels, and inference to act on that identity. It pays, books, signs, and runs autonomously.

---

## The problem

The agent economy on [Kite](https://gokite.ai) is built around a powerful primitive: a **Kite Agent Passport** that gives any autonomous agent its own on-chain identity, AA wallet, and the ability to settle x402-priced services without a human in the loop.

But standing up an actual agent that uses one is a weekend of plumbing:

- Provision and harden a server
- Generate a Kite-compatible EOA, derive an AA wallet from it, register a DID
- Install an agent runtime, choose and pay for an LLM, manage API keys
- Wire messaging channels (Telegram, Discord, Slack, Signal…)
- Register Kite MCP for tool access
- Survive across restarts, rotate credentials, watch the bill
- And then, you know, *build the actual agent*

Five accounts, ten configs, one process that crashes at 3 a.m.

## The solution

**kitebase** is a control plane for spawning Kite-native AI actors. One click:

1. Mint a fresh **Kite Agent Passport** — `did:kite:<owner>/<actor>` with a deterministic AA wallet derived via the [Kite AA SDK](https://www.npmjs.com/package/gokite-aa-sdk)
2. Provision a dedicated VPS, install [NousResearch's Hermes Agent](https://github.com/NousResearch/hermes-agent) runtime
3. Wire **Featherless** inference (no key required from the user)
4. Register the **Kite MCP server** so the actor can call Kite-chain tools
5. Bake in any messaging channel the user wants (Telegram, Discord, …)
6. Chat with the actor through an in-app proxy *while* the VPS is still provisioning

End result: zero-to-autonomous Kite actor in about three minutes.

## What an actor can do

Because every actor wears a Kite Agent Passport, it can transact on the Kite chain natively:

| | |
|---|---|
| **Pay for things** | Settle x402-priced services in USDC, bounded by a budget you set |
| **Sign on its own** | Hermes calls `gokite-aa-sdk` to sign UserOps with the actor's AA wallet — no manual approval per action |
| **Use Kite MCP tools** | Identity lookups, payment ops, on-chain queries — all surfaced as MCP tools the actor can invoke |
| **Live in any channel** | Hermes' built-in gateway means the actor handles Telegram / Discord / Slack / Signal / Email / SMS / Matrix with one credential each |
| **Re-config without redeploy** | A `kitebase-sync` systemd timer on each actor's VPS polls back to kitebase every 60 s, so credential changes apply live |

## Stack

| Layer | Choice |
|---|---|
| Chain | **Kite chain** (testnet by default), viem for reads, `gokite-aa-sdk` for AA wallet derivation |
| Identity | Deterministic AA wallet via `sdk.getAccountAddress(operator, keccak256(userId | actorName))` and `did:kite:<operatorLabel>/<actorName>` |
| Tools | [Kite MCP](https://docs.gokite.ai) at `mcp.prod.gokite.ai/api_key_<key>/mcp` |
| Settlement | x402 protocol over Kite testnet |
| Agent runtime | NousResearch Hermes Agent + `hermes gateway` as a systemd unit |
| Inference | Featherless (OpenAI-compatible) with `NousResearch/Hermes-3-Llama-3.1-8B` by default |
| Compute | Vultr v2 API, one VPS per actor (`POST /v2/instances` with cloud-init `user_data`) |
| Control plane | Bun 1.3+ — `Bun.serve()`, `bun:sqlite`, native TS |
| Web | Vite + React 18 + Tailwind; bundled into `dist/` and served by the same Bun process in production |
| TLS | Caddy + automatic Let's Encrypt issuance |
| Edge | Cloudflare Worker as a thin reverse proxy (hides origin IP, gives a clean URL) |

## How a deploy works

```
user                kitebase                 Vultr                   Actor VPS
 │  POST /v1/deployments                                                │
 ├──────────────────►│                                                  │
 │                   │ derive identity                                  │
 │                   │   - operator EOA (platform-passport model)       │
 │                   │   - salt = keccak256(userId | actorName)         │
 │                   │   - aaWallet = sdk.getAccountAddress(...)        │
 │                   │   - did = did:kite:<owner>/<actor>               │
 │                   │ render cloud-init w/ secrets + kitebase-sync     │
 │                   │ POST /v2/instances (user_data = cloud-init b64)  │
 │                   ├─────────────────────►│                           │
 │                   │                      │  spin up VPS              │
 │                   │                      ├──────────────────────────►│
 │                   │                      │       run cloud-init      │
 │                   │                      │       install Hermes      │
 │                   │                      │       hermes gateway up   │
 │                   │ poll status every 10s│                           │
 │                   ├─────────────────────►│                           │
 │  status: live                                                        │
 │◄──────────────────┤                                                  │
 │  chat (via Featherless proxy on kitebase)                            │
 ├──────────────────►│                                                  │
 │                   │                                                  │
 │                   │     kitebase-sync.timer polls /v1/agent/config every 60s
 │                   │◄─────────────────────────────────────────────────┤
 │                   │     -> rewrite ~/.hermes/.env, restart hermes    │
```

## Quick start (local dev)

```bash
bun install
cp .env.example .env
# fill VULTR_API_KEY, FEATHERLESS_API_KEY, KITE_OPERATOR_PRIVATE_KEY
bun run dev
```

Web on `http://localhost:3000` (Vite HMR), API on `:3001` (Bun). Vite proxies `/v1/*` to the API in dev.

## Layout

```
src/
  server.ts          Bun.serve entry + 10s Vultr status poller
  routes.ts          request router (API + static SPA fallback)
  config.ts          zod env validation
  store.ts           SQLite-backed deployment + user store
  deploy.ts          orchestrator: identity → cloud-init → Vultr → polling
  vultr.ts           minimal Vultr v2 client
  cloudInit.ts       cloud-init renderer for actor VPSes
  kitePassport.ts    Kite Agent Passport derivation (DID + AA wallet)
  web/               React app (Vite-served in dev, dist/-bundled in prod)
scripts/
  deployKitebase.ts  one-shot Vultr deploy of kitebase itself
  printCloudInit.ts  render the bootstrap script for manual fixups
```

## Deploying kitebase itself

```bash
bun scripts/deployKitebase.ts
```

Provisions a fresh Vultr VPS, bootstraps Bun + Caddy + git, clones this repo, builds the UI, writes `/opt/kitebase/.env` with the secrets from your local `.env`, installs systemd units, opens UFW for HTTP/HTTPS, and configures Caddy with auto-HTTPS on `https://<ip-with-dashes>.nip.io`. Total time ≈ 3-5 minutes.

The whole control plane runs from a single Bun process behind Caddy. Front it with a Cloudflare Worker (5-line reverse proxy) if you want to hide the origin IP — see `scripts/printCloudInit.ts` for the idempotent bootstrap.

## Channel hot-reload (no redeploy)

Each actor VPS installs a `kitebase-sync.timer` systemd unit that polls `https://<kitebase-host>/v1/agent/config?deploymentId=...` every 60 s, bearer-authed via a per-deployment shared secret minted at deploy time. When a user saves a new Telegram token in the actor's settings:

1. kitebase persists the token and bumps `configVersion`
2. The VPS notices the bump within ≈ 60 s
3. It rewrites the Telegram lines in `~/.hermes/.env` and `systemctl restart hermes`

`PUBLIC_BASE_URL` on the control plane controls this; without it the UI gracefully falls back to "destroy + redeploy" messaging.

## Required env

See `.env.example`. Non-optional:

- `KITE_OPERATOR_PRIVATE_KEY` — funded Kite EOA, all actors derive their AA wallets from it
- `VULTR_API_KEY` — for provisioning actor VPSes
- `FEATHERLESS_API_KEY` — for the bundled inference

Recommended for production:

- `PUBLIC_BASE_URL` — public URL of the control plane (enables channel hot-reload)
- `KITE_MCP_API_KEY` — platform-default Kite MCP key (every deployed actor inherits it)

## License

Private project.
