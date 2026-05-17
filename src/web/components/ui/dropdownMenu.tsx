// shadcn-style DropdownMenu (Radix DropdownMenu primitive).
// Content uses shadow-card + kbblue hairline; items are rounded-xl with a kbblue hover tint.
// destructive variant for items: text-error, hover bg-error/10.

import { forwardRef, type ComponentPropsWithoutRef } from 'react';
import { DropdownMenu as Radix } from 'radix-ui';
import { cn } from '../../lib/utils';

export const DropdownMenu = Radix.Root;
export const DropdownMenuTrigger = Radix.Trigger;
export const DropdownMenuGroup = Radix.Group;
export const DropdownMenuPortal = Radix.Portal;
export const DropdownMenuSub = Radix.Sub;
export const DropdownMenuRadioGroup = Radix.RadioGroup;

export const DropdownMenuContent = forwardRef<
  HTMLDivElement,
  ComponentPropsWithoutRef<typeof Radix.Content>
>(({ className, sideOffset = 6, ...props }, ref) => (
  <Radix.Portal>
    <Radix.Content
      ref={ref}
      sideOffset={sideOffset}
      data-slot="dropdown-menu-content"
      className={cn(
        'z-50 min-w-[12rem] overflow-hidden rounded-2xl border border-kbblue-300/40 bg-white p-1.5 text-navy shadow-card',
        'data-[state=open]:animate-in data-[state=closed]:animate-out',
        'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
        'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
        className,
      )}
      {...props}
    />
  </Radix.Portal>
));
DropdownMenuContent.displayName = 'DropdownMenuContent';

interface ItemProps extends ComponentPropsWithoutRef<typeof Radix.Item> {
  variant?: 'default' | 'destructive';
  inset?: boolean;
}

export const DropdownMenuItem = forwardRef<HTMLDivElement, ItemProps>(
  ({ className, variant = 'default', inset, ...props }, ref) => (
    <Radix.Item
      ref={ref}
      data-slot="dropdown-menu-item"
      data-variant={variant}
      data-inset={inset ? '' : undefined}
      className={cn(
        'relative flex cursor-pointer select-none items-center gap-2 rounded-xl px-3 py-1.5 text-sm font-medium outline-none transition',
        'focus:bg-kbblue-100/60 focus:text-navy',
        'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
        '[&_svg]:size-4 [&_svg]:shrink-0',
        variant === 'destructive'
          ? 'text-error focus:bg-error/10 focus:text-error'
          : 'text-navy',
        inset && 'pl-8',
        className,
      )}
      {...props}
    />
  ),
);
DropdownMenuItem.displayName = 'DropdownMenuItem';

export const DropdownMenuLabel = forwardRef<
  HTMLDivElement,
  ComponentPropsWithoutRef<typeof Radix.Label> & { inset?: boolean }
>(({ className, inset, ...props }, ref) => (
  <Radix.Label
    ref={ref}
    data-slot="dropdown-menu-label"
    className={cn(
      'px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-nautral-500',
      inset && 'pl-8',
      className,
    )}
    {...props}
  />
));
DropdownMenuLabel.displayName = 'DropdownMenuLabel';

export const DropdownMenuSeparator = forwardRef<
  HTMLDivElement,
  ComponentPropsWithoutRef<typeof Radix.Separator>
>(({ className, ...props }, ref) => (
  <Radix.Separator
    ref={ref}
    data-slot="dropdown-menu-separator"
    className={cn('-mx-0.5 my-1 h-px bg-kbblue-300/40', className)}
    {...props}
  />
));
DropdownMenuSeparator.displayName = 'DropdownMenuSeparator';

export const DropdownMenuShortcut = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) => (
  <span
    data-slot="dropdown-menu-shortcut"
    className={cn(
      'ms-auto text-[10px] font-mono uppercase tracking-wider text-nautral-500',
      className,
    )}
    {...props}
  />
);
