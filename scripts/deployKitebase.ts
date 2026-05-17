// Deploy kitebase itself to a Vultr VPS.
//
// What it does:
//   1. Reads your local .env for the secrets that will be baked into the
//      server's env-file (Vultr key, operator private key, Featherless key).
//   2. Generates a fresh COOKIE_SECRET for production (never reuses dev's).
//   3. Renders a cloud-init that installs Bun + Caddy + clones the repo,
//      builds the UI, writes the env-file, starts a systemd unit, and
//      configures Caddy as a reverse proxy with automatic HTTPS.
//   4. POSTs to Vultr to create the instance.
//   5. Polls until the instance has an IP, then prints the public URL.
//
// Public URL uses nip.io (<ip-with-dashes>.nip.io) so we don't need a domain.
// Caddy auto-issues a Let's Encrypt cert for that hostname.
//
// Usage:
//   bun scripts/deployKitebase.ts

import { randomBytes } from 'node:crypto';
import { loadEnv } from '../src/config';
import { createInstance, getInstance } from '../src/vultr';

const GITHUB_REPO = 'https://github.com/fozagtx/kitebase.git';
const SERVICE_LABEL = 'kitebase';

function escapeForHeredoc(value: string): string {
  return value.replace(/\$/g, '\\$').replace(/`/g, '\\`');
}

interface CloudInitInput {
  repoUrl: string;
  cookieSecret: string;
  featherlessKey: string;
  featherlessModel: string;
  vultrKey: string;
  vultrRegion: string;
  vultrPlan: string;
  vultrOsId: number;
  operatorKey: string;
  operatorLabel: string;
  kiteNetwork: string;
  kiteMcpKey?: string;
}

function renderCloudInit(input: CloudInitInput): string {
  // The env-file body, with bash-safe heredoc escaping
  const env = [
    `COOKIE_SECRET='${escapeForHeredoc(input.cookieSecret)}'`,
    `COOKIE_NAME=hc_session`,
    `DB_PATH=/var/lib/kitebase/kitebase.sqlite`,
    `PORT=3001`,
    `LOG_LEVEL=info`,
    `KITE_NETWORK=${input.kiteNetwork}`,
    `# PUBLIC_BASE_URL is set later by the script (after we know our IP)`,
    `FEATHERLESS_API_KEY='${escapeForHeredoc(input.featherlessKey)}'`,
    `FEATHERLESS_MODEL='${escapeForHeredoc(input.featherlessModel)}'`,
    `VULTR_API_KEY='${escapeForHeredoc(input.vultrKey)}'`,
    `VULTR_REGION=${input.vultrRegion}`,
    `VULTR_PLAN=${input.vultrPlan}`,
    `VULTR_OS_ID=${input.vultrOsId}`,
    `KITE_OPERATOR_PRIVATE_KEY=${input.operatorKey}`,
    `KITE_OPERATOR_LABEL=${input.operatorLabel}`,
  ];
  if (input.kiteMcpKey) {
    env.push(`KITE_MCP_API_KEY='${escapeForHeredoc(input.kiteMcpKey)}'`);
  }
  const envBody = env.join('\n');

  return `#!/bin/bash
set -eo pipefail
# Cloud-init's scripts-user runs without a shell env, so HOME is unset.
# Bun's installer dereferences $HOME and set -u would kill us. Set both
# defensively so the install proceeds cleanly.
export HOME=/root
export DEBIAN_FRONTEND=noninteractive

apt-get update
apt-get install -y curl git unzip ca-certificates debian-keyring debian-archive-keyring apt-transport-https gnupg

# Bun (system-wide)
curl -fsSL https://bun.sh/install | bash
ln -sf /root/.bun/bin/bun /usr/local/bin/bun

# Caddy
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | tee /etc/apt/sources.list.d/caddy-stable.list
apt-get update
apt-get install -y caddy

# Open HTTP/HTTPS in UFW (Vultr's Ubuntu image ships with UFW default-deny + only 22)
if command -v ufw >/dev/null 2>&1; then
  ufw allow 80/tcp || true
  ufw allow 443/tcp || true
fi

# Discover our public IPv4 + derive the nip.io hostname
PUB_IP=$(curl -s --max-time 10 https://api.ipify.org || curl -s --max-time 10 https://ifconfig.me)
NIP_HOST="\${PUB_IP//./-}.nip.io"
echo "public ip: $PUB_IP"
echo "nip host:  $NIP_HOST"

# Clone repo
mkdir -p /opt
git clone --depth 1 ${input.repoUrl} /opt/${SERVICE_LABEL}
cd /opt/${SERVICE_LABEL}

# Install deps + build UI (bun install includes devDependencies by default)
bun install
bun run build:web

# Write env file
mkdir -p /var/lib/${SERVICE_LABEL}
cat > /opt/${SERVICE_LABEL}/.env <<'KITEBASE_ENV_EOF'
${envBody}
KITEBASE_ENV_EOF
echo "PUBLIC_BASE_URL=https://\${NIP_HOST}" >> /opt/${SERVICE_LABEL}/.env
chmod 600 /opt/${SERVICE_LABEL}/.env

# systemd unit
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

# Caddy config: \${NIP_HOST} -> localhost:3001 with auto HTTPS
cat > /etc/caddy/Caddyfile <<CADDY_EOF
\${NIP_HOST} {
  reverse_proxy localhost:3001
}
CADDY_EOF

systemctl daemon-reload
systemctl enable --now ${SERVICE_LABEL}.service
systemctl restart caddy

# Write a readable status file for SSH inspection
cat > /root/kitebase-status <<STATUS_EOF
kitebase is up at https://\${NIP_HOST}
service: systemctl status ${SERVICE_LABEL}
logs:    journalctl -u ${SERVICE_LABEL} -f
caddy:   systemctl status caddy
STATUS_EOF
echo "kitebase deployment complete: https://\${NIP_HOST}"
`;
}

async function main() {
  const env = loadEnv();

  if (!env.VULTR_API_KEY) {
    throw new Error('VULTR_API_KEY missing - set it in .env before deploying');
  }
  if (!env.FEATHERLESS_API_KEY) {
    throw new Error('FEATHERLESS_API_KEY missing - set it in .env');
  }
  if (!env.KITE_OPERATOR_PRIVATE_KEY) {
    throw new Error('KITE_OPERATOR_PRIVATE_KEY missing - set it in .env');
  }

  const cookieSecret = randomBytes(48).toString('base64url');
  console.log('generated fresh COOKIE_SECRET for production');

  const userData = renderCloudInit({
    repoUrl: GITHUB_REPO,
    cookieSecret,
    featherlessKey: env.FEATHERLESS_API_KEY,
    featherlessModel: env.FEATHERLESS_MODEL,
    vultrKey: env.VULTR_API_KEY,
    vultrRegion: env.VULTR_REGION,
    vultrPlan: env.VULTR_PLAN,
    vultrOsId: env.VULTR_OS_ID,
    operatorKey: env.KITE_OPERATOR_PRIVATE_KEY,
    operatorLabel: env.KITE_OPERATOR_LABEL,
    kiteNetwork: env.KITE_NETWORK,
    kiteMcpKey: env.KITE_MCP_API_KEY,
  });
  console.log(`cloud-init rendered (${userData.length} chars)`);

  const instance = await createInstance(env, {
    region: env.VULTR_REGION,
    plan: env.VULTR_PLAN,
    osId: env.VULTR_OS_ID,
    label: SERVICE_LABEL,
    hostname: SERVICE_LABEL,
    userData,
    tags: ['kitebase', 'control-plane'],
  });
  console.log(`Vultr instance created: ${instance.instanceId}`);

  // Poll for IP + active status. Boot+install takes 3-5 minutes typically.
  let attempts = 0;
  const maxAttempts = 90; // 90 * 10s = 15 min
  while (attempts < maxAttempts) {
    const info = await getInstance(env, instance.instanceId);
    process.stdout.write(
      `  [${String(attempts).padStart(2, '0')}] status=${info.status} power=${info.powerStatus} server=${info.serverStatus} ip=${info.ip ?? '(none)'}\n`,
    );
    if (info.ip && info.status === 'active') {
      const nipHost = `${info.ip.replace(/\./g, '-')}.nip.io`;
      console.log('');
      console.log(`Vultr instance is ${info.status}+${info.powerStatus}+${info.serverStatus}.`);
      console.log(`kitebase will be reachable at:  https://${nipHost}`);
      console.log('');
      console.log('Caddy will issue a Let\'s Encrypt certificate on first request,');
      console.log('which takes another 10-30 seconds after the box is fully up.');
      console.log('');
      console.log('SSH access (root password emailed by Vultr) is via:');
      console.log(`  ssh root@${info.ip}`);
      console.log('Inspect:  cat /root/kitebase-status');
      console.log('Logs:     journalctl -u kitebase -f');
      return;
    }
    await new Promise((r) => setTimeout(r, 10_000));
    attempts++;
  }
  console.log('timed out waiting for the instance to become active. Check Vultr dashboard.');
}

main().catch((err) => {
  console.error('deploy failed:', err instanceof Error ? err.message : err);
  process.exit(1);
});
