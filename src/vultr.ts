// Minimal Vultr v2 API client. Just the endpoints we need for deploying agents.
//
// Auth: Bearer <api_key>
// Docs: https://www.vultr.com/api/

import type { AppEnv } from './config';
import type { VultrInstanceInfo } from './types';
import { logger } from './logger';

const BASE = 'https://api.vultr.com/v2';

export class VultrError extends Error {
  constructor(public status: number, public body: unknown, message?: string) {
    super(message ?? `vultr api error ${status}`);
  }
}

async function call<T>(env: AppEnv, path: string, init: RequestInit = {}): Promise<T> {
  if (!env.VULTR_API_KEY) {
    throw new VultrError(0, null, 'VULTR_API_KEY not set');
  }
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      authorization: `Bearer ${env.VULTR_API_KEY}`,
      'content-type': 'application/json',
      ...(init.headers ?? {}),
    },
  });
  const text = await res.text();
  let body: unknown = null;
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = { raw: text };
    }
  }
  if (!res.ok) {
    throw new VultrError(res.status, body, `vultr ${init.method ?? 'GET'} ${path} → ${res.status}`);
  }
  return body as T;
}

export interface VultrCreateInstanceInput {
  region: string;
  plan: string;
  osId: number;
  label: string;
  hostname: string;
  userData: string;
  tags?: string[];
}

interface VultrInstanceResp {
  instance: {
    id: string;
    main_ip: string;
    region: string;
    plan: string;
    os_id: number;
    status: string;
    power_status: string;
    server_status: string;
    date_created: string;
  };
}

function normalizeIp(ip: string | undefined): string | null {
  if (!ip || ip === '0.0.0.0' || ip === '') return null;
  return ip;
}

function toInfo(r: VultrInstanceResp['instance']): VultrInstanceInfo {
  return {
    instanceId: r.id,
    ip: normalizeIp(r.main_ip),
    region: r.region,
    plan: r.plan,
    os: r.os_id,
    status: r.status,
    powerStatus: r.power_status,
    serverStatus: r.server_status,
    createdAt: Date.parse(r.date_created),
  };
}

export async function createInstance(
  env: AppEnv,
  input: VultrCreateInstanceInput,
): Promise<VultrInstanceInfo> {
  const userDataB64 = Buffer.from(input.userData, 'utf8').toString('base64');
  const body = {
    region: input.region,
    plan: input.plan,
    os_id: input.osId,
    label: input.label,
    hostname: input.hostname,
    enable_ipv4: true,
    enable_ipv6: false,
    backups: 'disabled',
    user_data: userDataB64,
    tags: input.tags ?? [],
  };
  logger.info(
    { region: input.region, plan: input.plan, osId: input.osId, label: input.label },
    'vultr createInstance',
  );
  const r = await call<VultrInstanceResp>(env, '/instances', {
    method: 'POST',
    body: JSON.stringify(body),
  });
  return toInfo(r.instance);
}

export async function getInstance(env: AppEnv, instanceId: string): Promise<VultrInstanceInfo> {
  const r = await call<VultrInstanceResp>(env, `/instances/${instanceId}`);
  return toInfo(r.instance);
}

export async function destroyInstance(env: AppEnv, instanceId: string): Promise<void> {
  await call<void>(env, `/instances/${instanceId}`, { method: 'DELETE' });
}

export async function haltInstance(env: AppEnv, instanceId: string): Promise<void> {
  await call<void>(env, `/instances/${instanceId}/halt`, { method: 'POST' });
}

export async function startVultrInstance(env: AppEnv, instanceId: string): Promise<void> {
  await call<void>(env, `/instances/${instanceId}/start`, { method: 'POST' });
}

export async function rebootInstance(env: AppEnv, instanceId: string): Promise<void> {
  await call<void>(env, `/instances/${instanceId}/reboot`, { method: 'POST' });
}

export interface VultrRegion {
  id: string;
  city: string;
  country: string;
  continent: string;
}

export async function listRegions(env: AppEnv): Promise<VultrRegion[]> {
  const r = await call<{ regions: VultrRegion[] }>(env, '/regions');
  return r.regions;
}
