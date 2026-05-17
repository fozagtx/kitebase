// shadcn-style Badge with the project's pill/uppercase voice.
// Variants:
//   neutral  white / nautral text
//   blue     kbblue-100 / kbblue-700
//   success  success/15 / success
//   error    error/15 / error
//   muted    nautral-300 / nautral-600

import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { cn } from '../../lib/utils';

export type BadgeVariant = 'neutral' | 'blue' | 'success' | 'error' | 'muted';

const variants: Record<BadgeVariant, string> = {
  neutral: 'bg-white text-nautral-600',
  blue: 'bg-kbblue-100 text-kbblue-700',
  success: 'bg-success/15 text-success',
  error: 'bg-error/15 text-error',
  muted: 'bg-nautral-300 text-nautral-600',
};

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  dot?: ReactNode;
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ variant = 'neutral', className, dot, children, ...props }, ref) => (
    <span
      ref={ref}
      data-slot="badge"
      data-variant={variant}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider',
        variants[variant],
        className,
      )}
      {...props}
    >
      {dot}
      {children}
    </span>
  ),
);
Badge.displayName = 'Badge';
