import { useState } from 'react';
import { useAuth } from '../auth';
import { Alert } from './ui/alert';
import { Button } from './ui/button';
import { InnerTile } from './ui/card';

const KITE_TESTNET = {
  chainId: '0x940',
  chainName: 'KiteAI Testnet',
  nativeCurrency: { name: 'KITE', symbol: 'KITE', decimals: 18 },
  rpcUrls: ['https://rpc-testnet.gokite.ai/'],
  blockExplorerUrls: ['https://testnet.kitescan.ai'],
};

interface Eip1193Provider {
  request: (args: { method: string; params?: unknown[] | object }) => Promise<unknown>;
}

declare global {
  interface Window {
    ethereum?: Eip1193Provider;
  }
}

function short(addr: string): string {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export function KiteConnectButton() {
  const { user, setKiteAddress } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function connect() {
    setError(null);
    if (!window.ethereum) {
      setError('No EVM wallet detected. Install MetaMask.');
      return;
    }
    setBusy(true);
    try {
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: KITE_TESTNET.chainId }],
        });
      } catch (err) {
        const code = (err as { code?: number })?.code;
        if (code === 4902) {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [KITE_TESTNET],
          });
        }
      }
      const accounts = (await window.ethereum.request({
        method: 'eth_requestAccounts',
      })) as string[];
      const address = accounts[0];
      if (!address) throw new Error('no account returned');
      await setKiteAddress(address);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  async function disconnect() {
    setBusy(true);
    try {
      await setKiteAddress(null);
    } finally {
      setBusy(false);
    }
  }

  if (user?.kiteAddress) {
    return (
      <InnerTile className="flex items-center justify-between px-3 py-2.5">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-wider text-success">
            kite connected
          </div>
          <div className="font-mono text-xs text-navy">{short(user.kiteAddress)}</div>
        </div>
        <Button
          variant="link"
          size="xs"
          onClick={disconnect}
          disabled={busy}
          className="h-auto p-0 text-[10px] text-nautral-500 hover:text-error"
        >
          disconnect
        </Button>
      </InnerTile>
    );
  }

  return (
    <div className="space-y-1.5">
      <Button
        variant="outline"
        className="w-full"
        onClick={connect}
        disabled={busy}
      >
        {busy ? 'connecting…' : 'Connect Kite Wallet'}
      </Button>
      {error && <Alert variant="destructive">{error}</Alert>}
    </div>
  );
}
