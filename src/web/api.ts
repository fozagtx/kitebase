import type {
  ActivityBucket,
  ChatMessage,
  Deployment,
  DeploymentEvent,
  Health,
  PublicUser,
} from './types';

const base = import.meta.env.VITE_API_BASE ?? '';

async function send<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const res = await fetch(`${base}${path}`, {
    credentials: 'include',
    headers: { 'content-type': 'application/json', ...(init.headers ?? {}) },
    ...init,
  });
  if (!res.ok) {
    let body: { error?: string } | null = null;
    try {
      body = (await res.json()) as { error?: string };
    } catch {
      // not json
    }
    throw new ApiError(res.status, body?.error ?? `${path} → ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export const api = {
  health: () => send<Health>('/v1/health'),

  signup: (email: string, password: string) =>
    send<{ user: PublicUser }>('/v1/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  login: (email: string, password: string) =>
    send<{ user: PublicUser }>('/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  logout: () => send<{ ok: true }>('/v1/auth/logout', { method: 'POST' }),
  me: () => send<{ user: PublicUser | null }>('/v1/auth/me'),

  setKiteAddress: (address: string | null) =>
    send<{ user: PublicUser }>('/v1/user/kiteAddress', {
      method: 'POST',
      body: JSON.stringify({ address: address ?? '' }),
    }),

  listDeployments: () => send<{ items: Deployment[] }>('/v1/deployments'),
  createDeployment: (input: {
    agentName: string;
    telegramBotToken?: string;
    telegramAllowedUserId?: string;
    kiteMcpApiKey?: string;
  }) =>
    send<Deployment>('/v1/deployments', {
      method: 'POST',
      body: JSON.stringify(input),
    }),
  getDeployment: (id: string) => send<Deployment>(`/v1/deployments/${id}`),
  destroyDeployment: (id: string) =>
    send<{ ok: boolean }>(`/v1/deployments/${id}`, { method: 'DELETE' }),

  haltDeployment: (id: string) =>
    send<{ ok: boolean; reason?: string }>(`/v1/deployments/${id}/halt`, { method: 'POST' }),
  startDeployment: (id: string) =>
    send<{ ok: boolean; reason?: string }>(`/v1/deployments/${id}/start`, { method: 'POST' }),
  restartDeployment: (id: string) =>
    send<{ ok: boolean; reason?: string }>(`/v1/deployments/${id}/restart`, { method: 'POST' }),

  deploymentEvents: (id: string, since = 0) =>
    send<{ events: DeploymentEvent[] }>(`/v1/deployments/${id}/events?since=${since}`),

  setTelegramConfig: (
    id: string,
    botToken: string | null,
    allowedUserId: string | null,
  ) =>
    send<{
      ok: boolean;
      telegramBotUsername: string | null;
      liveReloadEnabled: boolean;
    }>(`/v1/deployments/${id}/telegram`, {
      method: 'POST',
      body: JSON.stringify({ botToken, allowedUserId }),
    }),

  chatHistory: (id: string) =>
    send<{ messages: ChatMessage[] }>(`/v1/deployments/${id}/chat`),
  sendChat: (id: string, text: string) =>
    send<{ reply: ChatMessage; history: ChatMessage[] }>(
      `/v1/deployments/${id}/chat`,
      { method: 'POST', body: JSON.stringify({ text }) },
    ),

  activity: (id: string, days = 14) =>
    send<{ buckets: ActivityBucket[] }>(
      `/v1/deployments/${id}/activity?days=${days}`,
    ),
};
