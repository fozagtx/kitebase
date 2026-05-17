import { Check, Loader2, X } from 'lucide-react';
import type { Deployment, DeploymentStatus } from '../types';
import { Card, InnerTile } from './ui/card';
import { DeploymentLog } from './DeploymentLog';

type StepKey = 'pending' | 'provisioning' | 'installing' | 'live';

const STEPS: { key: StepKey; label: string; description: string }[] = [
  {
    key: 'pending',
    label: 'Order placed',
    description: 'Identity minted on Kite, deploy queued.',
  },
  {
    key: 'provisioning',
    label: 'Provisioning VPS',
    description: 'Vultr is allocating a $5/mo instance for this actor.',
  },
  {
    key: 'installing',
    label: 'Installing Hermes',
    description: 'cloud-init is installing the Hermes Agent runtime + your env.',
  },
  {
    key: 'live',
    label: 'Live',
    description: 'Hermes gateway is up. Chat unlocked.',
  },
];

function stepIndex(status: DeploymentStatus): number {
  switch (status) {
    case 'pending':
      return 0;
    case 'provisioning':
      return 1;
    case 'installing':
      return 2;
    case 'live':
    case 'stopping':
    case 'stopped':
    case 'starting':
    case 'restarting':
      return 3;
    default:
      return 0;
  }
}

interface Props {
  deployment: Deployment;
}

export function DeploymentProgress({ deployment: d }: Props) {
  const failed = d.status === 'failed';
  const destroyed = d.status === 'destroyed';
  const current = stepIndex(d.status);
  const live = d.status === 'live';

  if (failed) {
    return (
      <Card className="gap-3 p-6">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-error">
          deploy failed
        </div>
        <p className="text-sm leading-relaxed text-nautral-700">
          {d.statusMessage ?? 'No further details. Check server logs for the Vultr response.'}
        </p>
      </Card>
    );
  }

  if (destroyed) {
    return (
      <Card className="gap-3 p-6">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-nautral-500">
          destroyed
        </div>
        <p className="text-sm leading-relaxed text-nautral-700">
          The VPS for this actor was destroyed. The on-chain AA wallet still exists.
        </p>
      </Card>
    );
  }

  return (
    <Card className="gap-4 p-6">
      <div>
        <div className="text-[11px] font-semibold uppercase tracking-wider text-nautral-500">
          deployment
        </div>
        <h2
          className="mt-1 font-serif text-2xl text-navy"
          style={{ letterSpacing: '-0.025em' }}
        >
          {live ? 'Live and ready.' : 'Bringing your actor online…'}
        </h2>
        {d.statusMessage && (
          <p className="mt-1 text-xs italic text-nautral-600">{d.statusMessage}</p>
        )}
      </div>

      <ol className="space-y-2">
        {STEPS.map((step, i) => {
          const isDone = i < current;
          const isCurrent = i === current && !live;
          const isLiveStep = i === 3 && live;
          return (
            <li key={step.key}>
              <InnerTile className="flex items-start gap-3 px-3 py-2.5">
                <span
                  className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                    isDone || isLiveStep
                      ? 'bg-success text-white'
                      : isCurrent
                        ? 'bg-kbblue-700 text-white'
                        : 'bg-nautral-300 text-nautral-600'
                  }`}
                >
                  {isDone || isLiveStep ? (
                    <Check className="h-3.5 w-3.5" />
                  ) : isCurrent ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <span className="text-[10px] font-semibold">{i + 1}</span>
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <div
                    className={`text-sm font-semibold ${
                      isCurrent || isDone || isLiveStep ? 'text-navy' : 'text-nautral-600'
                    }`}
                  >
                    {step.label}
                  </div>
                  <div className="text-[11px] leading-relaxed text-nautral-600">
                    {step.description}
                  </div>
                </div>
              </InnerTile>
            </li>
          );
        })}
      </ol>

      <DeploymentLog deploymentId={d.id} active={!live && !destroyed && !failed} />

      {!live && (
        <div className="text-[11px] text-nautral-500">
          Typically ~2-3 minutes end to end. Chat will unlock automatically once Hermes is up.
        </div>
      )}
    </Card>
  );
}

// keep the unused import friendly for tree-shake debuggability
void X;
