// Mint a Kite-aligned identity for a new actor under the kitebase platform passport.
//
// kitebase runs a single platform-managed Kite EOA (KITE_OPERATOR_PRIVATE_KEY).
// Every deployed actor gets:
//   - aaWallet:        deterministically derived from the operator via gokite-aa-sdk
//                      `getAccountAddress(operator, salt)` with salt = keccak(userId|actorName).
//                      Same user + same actor name always resolves to the same AA wallet.
//   - did:             did:kite:<KITE_OPERATOR_LABEL>/<safeActorName>
//   - ownerPrivateKey: the operator's master key (the actor inherits its identity
//                      from the platform passport; cloud-init bakes this onto the
//                      actor's VPS so it can sign UserOps on its own AA).

import { ethers } from 'ethers';
import { GokiteAASDK } from 'gokite-aa-sdk';
import type { AppEnv } from './config';
import type { AgentIdentity, HexAddress } from './types';

const RPC_URLS = {
  testnet: 'https://rpc-testnet.gokite.ai/',
  mainnet: 'https://rpc.gokite.ai/',
} as const;

const BUNDLER_URLS = {
  testnet: 'https://bundler-service.staging.gokite.ai/rpc/',
  mainnet: 'https://bundler-service.staging.gokite.ai/rpc/',
} as const;

function makeSdk(env: AppEnv): GokiteAASDK {
  const network = env.KITE_NETWORK === 'mainnet' ? 'kite_mainnet' : 'kite_testnet';
  return new GokiteAASDK(network, RPC_URLS[env.KITE_NETWORK], BUNDLER_URLS[env.KITE_NETWORK]);
}

function safeName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9-]/g, '-').slice(0, 32);
}

function saltFor(userId: string, actorName: string): bigint {
  const hash = ethers.keccak256(ethers.toUtf8Bytes(`${userId}/${safeName(actorName)}`));
  return BigInt(hash);
}

export function newAgentIdentity(
  env: AppEnv,
  agentName: string,
  userId: string,
): AgentIdentity {
  const sdk = makeSdk(env);
  const operator = new ethers.Wallet(env.KITE_OPERATOR_PRIVATE_KEY);
  const ownerAddress = operator.address as HexAddress;
  const salt = saltFor(userId, agentName);
  const aaWallet = sdk.getAccountAddress(ownerAddress, salt) as HexAddress;
  return {
    agentName,
    ownerAddress,
    ownerPrivateKey: env.KITE_OPERATOR_PRIVATE_KEY as HexAddress,
    aaWallet,
    did: `did:kite:${env.KITE_OPERATOR_LABEL}/${safeName(agentName)}`,
  };
}
