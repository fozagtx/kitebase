// Wallet panel: lets a logged-in user top up their actor's AA wallet from
// their own connected MetaMask (Kite testnet). Pulls live balances from the
// Kite RPC, ships native KITE via eth_sendTransaction.

import { useCallback, useEffect, useState } from 'react';
import { ArrowDownToLine, ExternalLink, RefreshCw } from 'lucide-react';
import { useAuth } from '../auth';
import type { Deployment } from '../types';
import { Alert } from './ui/alert';
import { Button } from './ui/button';
import { Card, InnerTile } from './ui/card';
import { Field } from './ui/field';

const KITE_TESTNET_RPC = 'https://rpc-testnet.gokite.ai/';
const KITE_TESTNET_CHAIN_ID = '0x940'; // 2368
const KITE_TESTNET_EXPLORER = 'https://testnet.kitescan.ai';

function short(v: string): string {
  return `${v.slice(0, 6)}…${v.slice(-4)}`;
}

function formatKite(wei: bigint | null): string {
  if (wei === null) return '—';
  const kite = Number(wei) / 1e18;
  if (kite === 0) return '0';
  if (kite < 0.0001) return '<0.0001';
  return kite.toFixed(4);
}

async function fetchBalance(address: string): Promise<bigint> {
  const res = await fetch(KITE_TESTNET_RPC, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'eth_getBalance',
      params: [address, 'latest'],
    }),
  });
  const data = (await res.json()) as { result?: string };
  return BigInt(data.result ?? '0x0');
}

interface Props {
  deployment: Deployment;
}

export function WalletPanel({ deployment: d }: Props) {
  const { user } = useAuth();
  const [aaBalance, setAaBalance] = useState<bigint | null>(null);
  const [userBalance, setUserBalance] = useState<bigint | null>(null);
  const [amount, setAmount] = useState('0.01');
  const [busy, setBusy] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ tx: string; explorer: string } | null>(null);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const aa = await fetchBalance(d.identity.aaWallet);
      setAaBalance(aa);
      if (user?.kiteAddress) {
        const u = await fetchBalance(user.kiteAddress);
        setUserBalance(u);
      } else {
        setUserBalance(null);
      }
    } catch {
      // network blip - keep last reading
    } finally {
      setRefreshing(false);
    }
  }, [d.identity.aaWallet, user?.kiteAddress]);

  useEffect(() => {
    void refresh();
    const id = setInterval(() => void refresh(), 5000);
    return () => clearInterval(id);
  }, [refresh]);

  async function topUp() {
    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
      if (!window.ethereum) throw new Error('No EVM wallet detected. Install MetaMask.');
      if (!user?.kiteAddress) {
        throw new Error('Connect your Kite wallet in the sidebar first.');
      }
      // Make sure MetaMask is on Kite testnet
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: KITE_TESTNET_CHAIN_ID }],
        });
      } catch {
        // user may already be on it, or has rejected
      }

      const parsed = Number.parseFloat(amount);
      if (!Number.isFinite(parsed) || parsed <= 0) {
        throw new Error('amount must be a positive number');
      }
      const wei = BigInt(Math.floor(parsed * 1e18));

      const txHash = (await window.ethereum.request({
        method: 'eth_sendTransaction',
        params: [
          {
            from: user.kiteAddress,
            to: d.identity.aaWallet,
            value: '0x' + wei.toString(16),
          },
        ],
      })) as string;

      setSuccess({
        tx: txHash,
        explorer: `${KITE_TESTNET_EXPLORER}/tx/${txHash}`,
      });
      // refresh balances right after — chain should catch up in a block
      setTimeout(() => void refresh(), 3000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      // MetaMask user-rejected has code 4001
      if (msg.toLowerCase().includes('user rejected')) {
        setError('Cancelled in MetaMask.');
      } else {
        setError(msg);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="gap-5 p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-nautral-500">
            wallet
          </div>
          <h2
            className="mt-1 font-serif text-2xl text-navy"
            style={{ letterSpacing: '-0.025em' }}
          >
            Top up {d.identity.agentName}
          </h2>
          <p className="mt-1 text-sm text-nautral-600">
            Send KITE from your wallet to your actor's AA wallet. Pays for its UserOp gas.
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => void refresh()}
          disabled={refreshing}
          aria-label="refresh balances"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <InnerTile className="px-4 py-3">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-nautral-500">
            your wallet
          </div>
          <div className="mt-1 font-mono text-xs text-navy">
            {user?.kiteAddress ? short(user.kiteAddress) : 'not connected'}
          </div>
          <div className="mt-2 text-lg font-semibold text-navy">
            {formatKite(userBalance)}{' '}
            <span className="text-xs font-normal text-nautral-500">KITE</span>
          </div>
        </InnerTile>
        <InnerTile className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-nautral-500">
              actor AA wallet
            </div>
            <a
              href={`${KITE_TESTNET_EXPLORER}/address/${d.identity.aaWallet}`}
              target="_blank"
              rel="noreferrer"
              className="text-[10px] text-kbblue-700 hover:underline"
            >
              <ExternalLink className="inline-block h-3 w-3" /> explorer
            </a>
          </div>
          <div className="mt-1 font-mono text-xs text-navy">
            {short(d.identity.aaWallet)}
          </div>
          <div className="mt-2 text-lg font-semibold text-navy">
            {formatKite(aaBalance)}{' '}
            <span className="text-xs font-normal text-nautral-500">KITE</span>
          </div>
        </InnerTile>
      </div>

      {!user?.kiteAddress ? (
        <Alert variant="info">
          Connect your Kite wallet in the sidebar to top up this actor.
        </Alert>
      ) : (
        <>
          <Field
            label="amount (KITE)"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.01"
            hint="testnet only — spend modestly"
          />
          {error && <Alert variant="destructive">{error}</Alert>}
          {success && (
            <Alert>
              Sent.{' '}
              <a
                className="font-semibold text-kbblue-700 hover:underline"
                href={success.explorer}
                target="_blank"
                rel="noreferrer"
              >
                View {short(success.tx)} on KiteScan ↗
              </a>
            </Alert>
          )}
          <Button
            onClick={() => void topUp()}
            disabled={busy || !amount.trim()}
            className="self-start"
          >
            <ArrowDownToLine className="h-4 w-4" />
            {busy ? 'waiting on MetaMask…' : `send ${amount} KITE`}
          </Button>
          <p className="text-[10.5px] leading-relaxed text-nautral-500">
            MetaMask will prompt you to sign. If you're not on Kite testnet, kitebase will
            ask MetaMask to switch first.
          </p>
        </>
      )}
    </Card>
  );
}
