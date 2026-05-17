export type DeploymentStatus =
  | 'pending'
  | 'provisioning'
  | 'installing'
  | 'live'
  | 'stopping'
  | 'stopped'
  | 'starting'
  | 'restarting'
  | 'failed'
  | 'destroyed';

export interface PublicUser {
  id: string;
  email: string;
  kiteAddress: string | null;
  createdAt: number;
}

export interface AgentIdentity {
  agentName: string;
  ownerAddress: string;
  aaWallet: string;
  did: string;
  ownerPrivateKey: string;
}

export interface VultrInstanceInfo {
  instanceId: string;
  ip: string | null;
  region: string;
  plan: string;
  os: number;
  status: string;
  powerStatus: string;
  serverStatus: string;
  createdAt: number;
}

export interface Deployment {
  id: string;
  status: DeploymentStatus;
  identity: AgentIdentity;
  vultr: VultrInstanceInfo | null;
  channels: { telegramBotUsername?: string };
  inferenceModel: string;
  kiteMcpEnabled: boolean;
  createdAt: number;
  updatedAt: number;
  statusMessage?: string;
  cloudInitPreview?: string;
}

export interface Health {
  ok: boolean;
  network: string;
  vultrConfigured: boolean;
  featherlessConfigured: boolean;
  kiteMcpConfigured: boolean;
  passportLabel: string;
  liveReloadEnabled: boolean;
  uptimeMs: number;
}

export interface ChatMessage {
  id: string;
  deploymentId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: number;
}

export interface ActivityBucket {
  date: string;
  user: number;
  assistant: number;
}

export interface DeploymentEvent {
  id: number;
  deploymentId: string;
  ts: number;
  kind: string;
  message: string;
}
