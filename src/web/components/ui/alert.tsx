// shadcn-style Alert (banner) - used for inline form errors and info notices.
// Variants:
//   info        kbblue tint
//   destructive error tint (replaces the recurring "rounded-xl border border-error/30…" inline)

import { forwardRef, type HTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

export type AlertVariant = 'info' | 'destructive';

const variants: Record<AlertVariant, string> = {
  info: 'border-kbblue-300/40 bg-kbblue-100/60 text-kbblue-900',
  destructive: 'border-error/30 bg-error/10 text-error',
};

interface AlertProps extends HTMLAttributes<HTMLDivElement> {
  variant?: AlertVariant;
}

export const Alert = forwardRef<HTMLDivElement, AlertProps>(
  ({ variant = 'info', className, role = 'alert', ...props }, ref) => (
    <div
      ref={ref}
      role={role}
      data-slot="alert"
      data-variant={variant}
      className={cn(
        'rounded-xl border px-3 py-2 text-xs',
        variants[variant],
        className,
      )}
      {...props}
    />
  ),
);
Alert.displayName = 'Alert';

export const AlertTitle = forwardRef<HTMLHeadingElement, HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h5
      ref={ref}
      data-slot="alert-title"
      className={cn('mb-0.5 text-xs font-semibold uppercase tracking-wider', className)}
      {...props}
    />
  ),
);
AlertTitle.displayName = 'AlertTitle';

export const AlertDescription = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="alert-description"
      className={cn('text-xs leading-relaxed', className)}
      {...props}
    />
  ),
);
AlertDescription.displayName = 'AlertDescription';
