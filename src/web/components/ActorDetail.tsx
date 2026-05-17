import { useState } from 'react';
import { Pause, Play, RotateCw } from 'lucide-react';
import { api } from '../api';
import type { Deployment } from '../types';
import { ActivityChart } from './ActivityChart';
import { ChatPanel } from './ChatPanel';
import { DeploymentProgress } from './DeploymentProgress';
import { TelegramSettings } from './TelegramSettings';
import { WalletPanel } from './WalletPanel';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alertDialog';
import { Avatar, AvatarInitials } from './ui/avatar';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import {
  Card,
  CardAction,
  CardHeader,
  CardTitle,
  InnerTile,
} from './ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdownMenu';
import { StatusBadge } from './ui/statusBadge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

function short(v: string | null | undefined, head = 10, tail = 8): string {
  if (!v) return '-';
  if (v.length <= head + tail + 1) return v;
  return `${v.slice(0, head)}…${v.slice(-tail)}`;
}

async function copy(value: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(value);
  } catch {
    // clipboard write blocked in some contexts - silently ignore
  }
}

type Busy = null | 'stop' | 'start' | 'restart' | 'destroy';

interface Props {
  deployment: Deployment;
  onDestroyed: () => void;
}

export function ActorDetail({ deployment: d, onDestroyed }: Props) {
  const [busy, setBusy] = useState<Busy>(null);
  const [destroyOpen, setDestroyOpen] = useState(false);
  const destroyed = d.status === 'destroyed';

  const isLive = d.status === 'live';
  const isStopped = d.status === 'stopped';
  const isTransitioning =
    d.status === 'provisioning' ||
    d.status === 'installing' ||
    d.status === 'stopping' ||
    d.status === 'starting' ||
    d.status === 'restarting' ||
    d.status === 'pending';

  async function doStop() {
    setBusy('stop');
    try {
      await api.haltDeployment(d.id);
    } finally {
      setBusy(null);
    }
  }
  async function doStart() {
    setBusy('start');
    try {
      await api.startDeployment(d.id);
    } finally {
      setBusy(null);
    }
  }
  async function doRestart() {
    setBusy('restart');
    try {
      await api.restartDeployment(d.id);
    } finally {
      setBusy(null);
    }
  }
  async function doDestroy() {
    setBusy('destroy');
    try {
      await api.destroyDeployment(d.id);
      setDestroyOpen(false);
      onDestroyed();
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex h-full flex-col px-6 pb-6 pt-6">
      <Card asChild className="gap-3 p-6">
        <header>
          <CardHeader className="gap-1">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-nautral-500">
              actor
            </div>
            <CardTitle className="flex items-center gap-3 text-3xl">
              <Avatar className="h-10 w-10">
                <AvatarInitials name={d.identity.agentName} />
              </Avatar>
              {d.identity.agentName}
              <StatusBadge status={d.status} />
              {d.vultr && (
                <Badge
                  variant={d.vultr.powerStatus === 'running' ? 'success' : 'muted'}
                  className="ml-0"
                  dot={
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        d.vultr.powerStatus === 'running' ? 'bg-success' : 'bg-nautral-500'
                      }`}
                    />
                  }
                >
                  vps {d.vultr.powerStatus}
                </Badge>
              )}
            </CardTitle>
            {d.statusMessage && (
              <div className="text-xs italic text-nautral-600">{d.statusMessage}</div>
            )}
            <CardAction>
              <div className="flex items-center gap-2">
                {/* power actions, contextual to status */}
                {isLive && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={busy !== null}
                      onClick={() => void doStop()}
                      aria-label="stop actor"
                    >
                      <Pause className="h-3.5 w-3.5" />
                      {busy === 'stop' ? 'stopping…' : 'stop'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={busy !== null}
                      onClick={() => void doRestart()}
                      aria-label="restart actor"
                    >
                      <RotateCw className="h-3.5 w-3.5" />
                      {busy === 'restart' ? 'restarting…' : 'restart'}
                    </Button>
                  </>
                )}
                {isStopped && (
                  <Button
                    size="sm"
                    disabled={busy !== null}
                    onClick={() => void doStart()}
                    aria-label="start actor"
                  >
                    <Play className="h-3.5 w-3.5" />
                    {busy === 'start' ? 'starting…' : 'start'}
                  </Button>
                )}
                {isTransitioning && (
                  <Button variant="outline" size="sm" disabled>
                    <RotateCw className="h-3.5 w-3.5 animate-spin" />
                    {d.status}
                  </Button>
                )}

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" aria-label="actor actions">
                      ▾
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>copy</DropdownMenuLabel>
                    <DropdownMenuItem onSelect={() => void copy(d.identity.did)}>
                      Copy DID
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => void copy(d.identity.aaWallet)}>
                      Copy AA wallet
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => void copy(d.identity.ownerAddress)}>
                      Copy owner address
                    </DropdownMenuItem>
                    {d.vultr?.ip && (
                      <DropdownMenuItem onSelect={() => void copy(d.vultr!.ip!)}>
                        Copy VPS IP
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      variant="destructive"
                      disabled={destroyed || busy !== null}
                      onSelect={(e) => {
                        e.preventDefault();
                        setDestroyOpen(true);
                      }}
                    >
                      Destroy actor
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardAction>
          </CardHeader>
        </header>
      </Card>

      <AlertDialog open={destroyOpen} onOpenChange={setDestroyOpen}>
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Destroy "{d.identity.agentName}"?</AlertDialogTitle>
            <AlertDialogDescription>
              This shuts down the actor's Hermes runtime and destroys its Vultr VPS. The
              on-chain AA wallet keeps existing - only the live deployment goes away.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy === 'destroy'}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              destructive
              disabled={busy === 'destroy'}
              onClick={(e) => {
                e.preventDefault();
                void doDestroy();
              }}
            >
              {busy === 'destroy' ? 'destroying…' : 'Destroy actor'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Tabs
        key={isLive ? 'live' : 'deploying'}
        defaultValue={isLive ? 'chat' : 'deployment'}
        className="mt-5 flex flex-1 flex-col overflow-hidden"
      >
        <TabsList className="self-start">
          {!isLive && <TabsTrigger value="deployment">Deployment</TabsTrigger>}
          <TabsTrigger value="chat" disabled={!isLive}>
            Chat{!isLive && ' (locked)'}
          </TabsTrigger>
          <TabsTrigger value="wallet">Wallet</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="identity">Identity</TabsTrigger>
        </TabsList>

        {!isLive && (
          <TabsContent value="deployment" className="flex-1 overflow-auto">
            <DeploymentProgress deployment={d} />
          </TabsContent>
        )}

        <TabsContent value="chat" className="flex-1 overflow-hidden">
          <ChatPanel deployment={d} />
        </TabsContent>

        <TabsContent value="wallet">
          <WalletPanel deployment={d} />
        </TabsContent>

        <TabsContent value="activity">
          <ActivityChart deploymentId={d.id} />
        </TabsContent>

        <TabsContent value="identity" className="space-y-3">
          <TelegramSettings deployment={d} onUpdated={() => undefined} />
          <Card size="sm" className="gap-3 p-5">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-nautral-500">
              identity
            </div>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <Stat label="did" value={d.identity.did} highlight />
              <Stat label="aa wallet" value={short(d.identity.aaWallet)} />
              <Stat label="owner" value={short(d.identity.ownerAddress)} />
              <Stat
                label="vps ip"
                value={d.vultr?.ip ?? (d.vultr ? 'allocating…' : '-')}
              />
              <Stat label="model" value={d.inferenceModel} />
              <Stat label="kite mcp" value={d.kiteMcpEnabled ? 'enabled' : 'disabled'} />
              <Stat
                label="vps id"
                value={d.vultr?.instanceId ? short(d.vultr.instanceId, 8, 6) : '-'}
              />
              <Stat
                label="telegram"
                value={d.channels.telegramBotUsername ?? '-'}
              />
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <InnerTile className="px-3 py-2">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-nautral-500">
        {label}
      </div>
      <div
        className={`mt-0.5 truncate font-mono text-xs ${highlight ? 'text-kbblue-700' : 'text-navy'}`}
      >
        {value}
      </div>
    </InnerTile>
  );
}
