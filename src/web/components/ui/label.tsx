// shadcn-style Label (Radix Label primitive), styled with the project's micro-label voice:
// uppercase tracking-wider nautral-500 caption.

import { forwardRef, type ComponentPropsWithoutRef } from 'react';
import { Label as RadixLabel } from 'radix-ui';
import { cn } from '../../lib/utils';

export const Label = forwardRef<HTMLLabelElement, ComponentPropsWithoutRef<typeof RadixLabel.Root>>(
  ({ className, ...props }, ref) => (
    <RadixLabel.Root
      ref={ref}
      data-slot="label"
      className={cn(
        'text-[11px] font-semibold uppercase tracking-wider text-nautral-500',
        'peer-disabled:cursor-not-allowed peer-disabled:opacity-60',
        className,
      )}
      {...props}
    />
  ),
);
Label.displayName = 'Label';
