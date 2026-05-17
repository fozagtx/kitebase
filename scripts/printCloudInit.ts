// Print the kitebase cloud-init bash script to stdout, with secrets from
// the local .env baked in. Used for one-shot fixups on an existing VPS:
//
//   bun scripts/printCloudInit.ts > /tmp/fixup.sh
//   scp /tmp/fixup.sh root@<vps>:/root/fixup.sh
//   ssh root@<vps> bash /root/fixup.sh
//
// The same renderer that deployKitebase.ts uses, called directly. Useful
// when a fresh deploy half-installed (e.g. cloud-init bailed mid-script)
// and you want to re-run the installer in place rather than redeploy.

import { randomBytes } from 'node:crypto';
import { loadEnv } from '../src/config';

// Re-export by re-rendering through a thin wrapper. The renderer lives in
// deployKitebase.ts as a private function; rather than break that
// encapsulation, we duplicate the small bash template here. Both files
// MUST stay in sync - if you edit one, edit the other.

const GITHUB_REPO = 'https://github.com/fozagtx/kitebase.git';
const SERVICE_LABEL = 'kitebase';

function escapeForHeredoc(value: string): string {
  return value.replace(/\$/g, '\\$').replace(/`/g, '\\`');
}

const env = loadEnv();
if (!env.FEATHERLESS_API_KEY || !env.VULTR_API_KEY || !env.KITE_OPERATOR_PRIVATE_KEY) {
  throw new Error('FEATHERLESS_API_KEY, VULTR_API_KEY, and KITE_OPERATOR_PRIVATE_KEY all required');
}
const cookieSecret = randomBytes(48).toString('base64url');

const envLines = [
  `COOKIE_SECRET='${escapeForHeredoc(cookieSecret)}'`,
  `COOKIE_NAME=hc_session`,
  `DB_PATH=/var/lib/kitebase/kitebase.sqlite`,
  `PORT=3001`,
  `LOG_LEVEL=info`,
  `KITE_NETWORK=${env.KITE_NETWORK}`,
  `FEATHERLESS_API_KEY='${escapeForHeredoc(env.FEATHERLESS_API_KEY)}'`,
  `FEATHERLESS_MODEL='${escapeForHeredoc(env.FEATHERLESS_MODEL)}'`,
  `VULTR_API_KEY='${escapeForHeredoc(env.VULTR_API_KEY)}'`,
  `VULTR_REGION=${env.VULTR_REGION}`,
  `VULTR_PLAN=${env.VULTR_PLAN}`,
  `VULTR_OS_ID=${env.VULTR_OS_ID}`,
  `KITE_OPERATOR_PRIVATE_KEY=${env.KITE_OPERATOR_PRIVATE_KEY}`,
  `KITE_OPERATOR_LABEL=${env.KITE_OPERATOR_LABEL}`,
];
if (env.KITE_MCP_API_KEY) {
  envLines.push(`KITE_MCP_API_KEY='${escapeForHeredoc(env.KITE_MCP_API_KEY)}'`);
}
const envBody = envLines.join('\n');

const script = `#!/bin/bash
set -eo pipefail
export HOME=/root
export DEBIAN_FRONTEND=noninteractive

# This script is idempotent - safe to re-run if a prior attempt half-finished.

apt-get update
apt-get install -y curl git unzip ca-certificates debian-keyring debian-archive-keyring apt-transport-https gnupg

# Bun (system-wide)
if ! command -v bun >/dev/null 2>&1; then
  curl -fsSL https://bun.sh/install | bash
  ln -sf /root/.bun/bin/bun /usr/local/bin/bun
fi

# Caddy
if ! command -v caddy >/dev/null 2>&1; then
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | tee /etc/apt/sources.list.d/caddy-stable.list
  apt-get update
  apt-get install -y caddy
fi

PUB_IP=$(curl -s --max-time 10 https://api.ipify.org || curl -s --max-time 10 https://ifconfig.me)
NIP_HOST="\${PUB_IP//./-}.nip.io"
echo "public ip: $PUB_IP"
echo "nip host:  $NIP_HOST"

mkdir -p /opt
if [ ! -d /opt/${SERVICE_LABEL} ]; then
  git clone --depth 1 ${GITHUB_REPO} /opt/${SERVICE_LABEL}
else
  cd /opt/${SERVICE_LABEL} && git pull --ff-only || true
fi
cd /opt/${SERVICE_LABEL}

bun install
bun run build:web

mkdir -p /var/lib/${SERVICE_LABEL}
cat > /opt/${SERVICE_LABEL}/.env <<'KITEBASE_ENV_EOF'
${envBody}
KITEBASE_ENV_EOF
echo "PUBLIC_BASE_URL=https://\${NIP_HOST}" >> /opt/${SERVICE_LABEL}/.env
chmod 600 /opt/${SERVICE_LABEL}/.env

cat > /etc/systemd/system/${SERVICE_LABEL}.service <<'UNIT_EOF'
[Unit]
Description=kitebase control plane
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
WorkingDirectory=/opt/${SERVICE_LABEL}
EnvironmentFile=/opt/${SERVICE_LABEL}/.env
ExecStart=/usr/local/bin/bun src/server.ts
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
UNIT_EOF

cat > /etc/caddy/Caddyfile <<CADDY_EOF
\${NIP_HOST} {
  reverse_proxy localhost:3001
}
CADDY_EOF

systemctl daemon-reload
systemctl enable --now ${SERVICE_LABEL}.service
systemctl restart caddy

cat > /root/kitebase-status <<STATUS_EOF
kitebase is up at https://\${NIP_HOST}
service: systemctl status ${SERVICE_LABEL}
logs:    journalctl -u ${SERVICE_LABEL} -f
caddy:   systemctl status caddy
STATUS_EOF
echo "kitebase setup complete: https://\${NIP_HOST}"
`;

process.stdout.write(script);
