// Generate the cloud-init bash script that runs on a fresh Vultr instance.
//
// What it does:
//   1. Updates apt, installs deps the Hermes installer expects
//   2. Creates a `hermes` user
//   3. Runs the official Hermes installer (NousResearch one-liner)
//   4. Writes ~/.hermes/.env with Telegram, Featherless, agent identity
//   5. Registers the Kite MCP server with Hermes (if KITE_MCP_API_KEY is supplied)
//   6. Installs a systemd unit and starts `hermes gateway`
//   7. If PUBLIC_BASE_URL is set, installs a kitebase-sync systemd timer that
//      polls the control plane every minute for live config changes (Telegram
//      token, allowed users) and reloads hermes without redeploying.
//
// All template fields are interpolated server-side. Secrets land in
// ~/.hermes/.env on the VPS only.

import type { AgentIdentity, DeploymentRequest } from './types';
import type { AppEnv } from './config';

export interface CloudInitArgs {
  env: AppEnv;
  identity: AgentIdentity;
  request: DeploymentRequest;
  deploymentId: string;
  controlToken: string;
}

function escapeForSingleQuotes(value: string): string {
  return value.replace(/'/g, `'\\''`);
}

export function renderCloudInit(args: CloudInitArgs): string {
  const { env, identity, request, deploymentId, controlToken } = args;
  const featherlessModel = request.inferenceModel ?? env.FEATHERLESS_MODEL;
  const kiteMcpApiKey = request.kiteMcpApiKey ?? env.KITE_MCP_API_KEY;
  const kiteMcpUrl = kiteMcpApiKey
    ? `${env.KITE_MCP_BASE}/api_key_${kiteMcpApiKey}/mcp`
    : '';

  const envLines: string[] = [
    `AGENT_NAME='${escapeForSingleQuotes(identity.agentName)}'`,
    `AGENT_DID='${escapeForSingleQuotes(identity.did)}'`,
    `AGENT_OWNER_ADDRESS='${identity.ownerAddress}'`,
    `AGENT_AA_WALLET='${identity.aaWallet}'`,
    `AGENT_OWNER_PRIVATE_KEY='${identity.ownerPrivateKey}'`,
    `OPENAI_BASE_URL='https://api.featherless.ai/v1'`,
    `OPENAI_MODEL='${escapeForSingleQuotes(featherlessModel)}'`,
  ];
  if (env.FEATHERLESS_API_KEY) {
    envLines.push(`OPENAI_API_KEY='${escapeForSingleQuotes(env.FEATHERLESS_API_KEY)}'`);
  }
  if (request.telegramBotToken) {
    envLines.push(`TELEGRAM_BOT_TOKEN='${escapeForSingleQuotes(request.telegramBotToken)}'`);
  }
  if (request.telegramAllowedUserId) {
    envLines.push(`TELEGRAM_ALLOWED_USERS='${escapeForSingleQuotes(request.telegramAllowedUserId)}'`);
  }

  const envFileBody = envLines.join('\n');

  const mcpBlock = kiteMcpUrl
    ? `# wire Kite MCP server into Hermes
sudo -u hermes -H bash -lc 'hermes mcp add kite "${kiteMcpUrl}"' || true`
    : '# (no KITE_MCP_API_KEY provided - agent runs without Kite tools)';

  // Hot-reload sync block. Only installed when PUBLIC_BASE_URL is set so the
  // VPS can reach back. Polls /v1/agent/config every minute; rewrites the
  // Telegram lines in ~/.hermes/.env and restarts hermes when configVersion
  // bumps.
  const hotReloadBlock = env.PUBLIC_BASE_URL
    ? renderHotReload({
        publicBaseUrl: env.PUBLIC_BASE_URL,
        deploymentId,
        controlToken,
      })
    : '# (PUBLIC_BASE_URL not set on control plane - channel hot-reload disabled)';

  return `#!/bin/bash
set -euo pipefail

export DEBIAN_FRONTEND=noninteractive
apt-get update
apt-get install -y curl git ca-certificates build-essential jq

# create dedicated user
id -u hermes >/dev/null 2>&1 || useradd -m -s /bin/bash hermes

# install Hermes Agent (official NousResearch installer)
sudo -u hermes -H bash -lc 'curl -fsSL https://raw.githubusercontent.com/NousResearch/hermes-agent/main/scripts/install.sh | bash'

# write agent secrets to ~/.hermes/.env
sudo -u hermes -H mkdir -p /home/hermes/.hermes
sudo -u hermes -H bash -c 'cat > /home/hermes/.hermes/.env <<"HERMES_ENV_EOF"
${envFileBody}
HERMES_ENV_EOF'
chmod 600 /home/hermes/.hermes/.env
chown hermes:hermes /home/hermes/.hermes/.env

${mcpBlock}

# install systemd unit
cat > /etc/systemd/system/hermes.service <<'UNIT_EOF'
[Unit]
Description=Hermes Agent gateway
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=hermes
WorkingDirectory=/home/hermes
EnvironmentFile=/home/hermes/.hermes/.env
ExecStart=/home/hermes/.local/bin/hermes gateway
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
UNIT_EOF

systemctl daemon-reload
systemctl enable hermes.service
systemctl start hermes.service

${hotReloadBlock}
`;
}

interface HotReloadArgs {
  publicBaseUrl: string;
  deploymentId: string;
  controlToken: string;
}

function renderHotReload(args: HotReloadArgs): string {
  const { publicBaseUrl, deploymentId, controlToken } = args;
  // The shell variables here are interpolated by the control plane (not by bash on the VPS).
  return `# ------- kitebase-sync: live channel config from control plane -------
mkdir -p /etc/kitebase /var/lib/kitebase
cat > /etc/kitebase/control.env <<'KB_CTRL_EOF'
KITEBASE_URL='${publicBaseUrl.replace(/\/$/, '')}'
DEPLOYMENT_ID='${deploymentId}'
CONTROL_TOKEN='${controlToken}'
KB_CTRL_EOF
chmod 600 /etc/kitebase/control.env

cat > /usr/local/bin/kitebase-sync <<'KB_SYNC_EOF'
#!/usr/bin/env bash
set -euo pipefail
# shellcheck disable=SC1091
. /etc/kitebase/control.env

ENV_FILE=/home/hermes/.hermes/.env
STATE_FILE=/var/lib/kitebase/configVersion
CURRENT_VERSION=$(cat "$STATE_FILE" 2>/dev/null || echo 0)

RESP=$(curl -fsS --max-time 15 \\
  -H "authorization: Bearer $CONTROL_TOKEN" \\
  "$KITEBASE_URL/v1/agent/config?deploymentId=$DEPLOYMENT_ID" || true)

if [ -z "$RESP" ]; then
  exit 0
fi

VERSION=$(printf '%s' "$RESP" | jq -r '.configVersion // 0')
if [ "$VERSION" -le "$CURRENT_VERSION" ]; then
  exit 0
fi

TG_TOKEN=$(printf '%s' "$RESP" | jq -r '.telegramBotToken // empty')
TG_ALLOWED=$(printf '%s' "$RESP" | jq -r '.telegramAllowedUsers // empty')

TMP=$(mktemp)
if [ -f "$ENV_FILE" ]; then
  grep -v -E "^(TELEGRAM_BOT_TOKEN|TELEGRAM_ALLOWED_USERS)=" "$ENV_FILE" > "$TMP" || true
fi
if [ -n "$TG_TOKEN" ]; then
  printf "TELEGRAM_BOT_TOKEN='%s'\\n" "$TG_TOKEN" >> "$TMP"
fi
if [ -n "$TG_ALLOWED" ]; then
  printf "TELEGRAM_ALLOWED_USERS='%s'\\n" "$TG_ALLOWED" >> "$TMP"
fi
install -o hermes -g hermes -m 600 "$TMP" "$ENV_FILE"
rm -f "$TMP"

systemctl restart hermes.service || true
echo "$VERSION" > "$STATE_FILE"
logger -t kitebase-sync "applied configVersion=$VERSION"
KB_SYNC_EOF
chmod +x /usr/local/bin/kitebase-sync

cat > /etc/systemd/system/kitebase-sync.service <<'KB_UNIT_EOF'
[Unit]
Description=kitebase live config sync
After=network-online.target hermes.service
Wants=network-online.target

[Service]
Type=oneshot
ExecStart=/usr/local/bin/kitebase-sync
KB_UNIT_EOF

cat > /etc/systemd/system/kitebase-sync.timer <<'KB_TIMER_EOF'
[Unit]
Description=Run kitebase-sync every minute

[Timer]
OnBootSec=30
OnUnitActiveSec=60
AccuracySec=10

[Install]
WantedBy=timers.target
KB_TIMER_EOF

systemctl daemon-reload
systemctl enable --now kitebase-sync.timer
# ---------------------------------------------------------------------`;
}
