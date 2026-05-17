// shadcn-style Separator wrapping Radix Separator.

import { forwardRef, type ComponentPropsWithoutRef } from 'react';
import { Separator as RadixSeparator } from 'radix-ui';
import { cn } from '../../lib/utils';

export const Separator = forwardRef<
  HTMLDivElement,
  ComponentPropsWithoutRef<typeof RadixSeparator.Root>
>(({ className, orientation = 'horizontal', decorative = true, ...props }, ref) => (
  <RadixSeparator.Root
    ref={ref}
    decorative={decorative}
    orientation={orientation}
    data-slot="separator"
    className={cn(
      'shrink-0 bg-kbblue-300/40',
      orientation === 'horizontal' ? 'h-px w-full' : 'h-full w-px',
      className,
    )}
    {...props}
  />
));
Separator.displayName = 'Separator';
