export type HexAddress = `0x${string}`;
export type HexHash = `0x${string}`;

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

export interface DeploymentRequest {
  agentName: string;
  telegramBotToken?: string;
  telegramAllowedUserId?: string;
  inferenceModel?: string;
  kiteMcpApiKey?: string;
}

export interface AgentIdentity {
  agentName: string;
  ownerAddress: HexAddress;
  aaWallet: HexAddress;
  did: string;
  ownerPrivateKey: HexAddress;
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
  channels: {
    telegramBotUsername?: string;
  };
  inferenceModel: string;
  kiteMcpEnabled: boolean;
  createdAt: number;
  updatedAt: number;
  statusMessage?: string;
  cloudInitPreview?: string;
}
