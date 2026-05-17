// StatusBadge maps Deployment status → Badge variant + animated indicator dot.
// Used in the actor header and the sidebar list (dot-only variant).

import { Badge, type BadgeVariant } from './badge';
import { cn } from '../../lib/utils';
import type { DeploymentStatus } from '../../types';

const variantByStatus: Record<DeploymentStatus, BadgeVariant> = {
  pending: 'neutral',
  provisioning: 'blue',
  installing: 'blue',
  live: 'success',
  stopping: 'blue',
  stopped: 'muted',
  starting: 'blue',
  restarting: 'blue',
  failed: 'error',
  destroyed: 'muted',
};

const dotByStatus: Record<DeploymentStatus, string> = {
  pending: 'bg-nautral-500',
  provisioning: 'bg-kbblue-700 animate-pulse',
  installing: 'bg-kbblue-700 animate-pulse',
  live: 'bg-success',
  stopping: 'bg-kbblue-700 animate-pulse',
  stopped: 'bg-nautral-500',
  starting: 'bg-kbblue-700 animate-pulse',
  restarting: 'bg-kbblue-700 animate-pulse',
  failed: 'bg-error',
  destroyed: 'bg-nautral-500',
};

interface Props {
  status: DeploymentStatus;
  className?: string;
  label?: string;
}

export function StatusBadge({ status, className, label }: Props) {
  return (
    <Badge
      variant={variantByStatus[status]}
      className={className}
      dot={<span className={cn('h-1.5 w-1.5 rounded-full', dotByStatus[status])} />}
    >
      {label ?? status}
    </Badge>
  );
}

interface DotProps {
  status: DeploymentStatus;
  className?: string;
}

// StatusDot: the indicator alone, for tight UI (sidebar rows).
export function StatusDot({ status, className }: DotProps) {
  return (
    <span
      aria-label={status}
      className={cn('h-1.5 w-1.5 shrink-0 rounded-full', dotByStatus[status], className)}
    />
  );
}
