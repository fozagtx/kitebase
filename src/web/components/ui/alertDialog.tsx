// shadcn-style AlertDialog port, styled with Charms tokens.
// Same primitive names + composition as @shadcn/ui:
//   AlertDialog > AlertDialogTrigger
//   AlertDialog > AlertDialogContent
//     > AlertDialogHeader > AlertDialogTitle / AlertDialogDescription / AlertDialogMedia
//     > AlertDialogFooter > AlertDialogCancel / AlertDialogAction

import {
  forwardRef,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type ReactNode,
} from 'react';
import { AlertDialog as Radix } from 'radix-ui';
import { cn } from '../../lib/utils';

export const AlertDialog = Radix.Root;
export const AlertDialogTrigger = Radix.Trigger;
export const AlertDialogPortal = Radix.Portal;

interface ContentProps extends HTMLAttributes<HTMLDivElement> {
  size?: 'default' | 'sm';
}

export const AlertDialogOverlay = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <Radix.Overlay
      ref={ref}
      className={cn(
        'fixed inset-0 z-50 bg-navy/30 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out',
        className,
      )}
      {...props}
    />
  ),
);
AlertDialogOverlay.displayName = 'AlertDialogOverlay';

export const AlertDialogContent = forwardRef<HTMLDivElement, ContentProps>(
  ({ className, size = 'default', children, ...props }, ref) => (
    <AlertDialogPortal>
      <AlertDialogOverlay />
      <Radix.Content
        ref={ref}
        className={cn(
          'fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 rounded-3xl bg-skeleton p-7 shadow-card focus:outline-none',
          size === 'sm' ? 'w-[360px]' : 'w-[440px]',
          className,
        )}
        {...props}
      >
        {children}
      </Radix.Content>
    </AlertDialogPortal>
  ),
);
AlertDialogContent.displayName = 'AlertDialogContent';

export function AlertDialogHeader({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return <div className={cn('flex flex-col gap-1.5 text-center', className)}>{children}</div>;
}

export function AlertDialogFooter({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn('mt-6 flex items-center justify-between gap-3', className)}>
      {children}
    </div>
  );
}

export const AlertDialogTitle = forwardRef<HTMLHeadingElement, HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <Radix.Title
      ref={ref}
      className={cn('font-serif text-2xl text-navy', className)}
      style={{ letterSpacing: '-0.025em' }}
      {...props}
    />
  ),
);
AlertDialogTitle.displayName = 'AlertDialogTitle';

export const AlertDialogDescription = forwardRef<
  HTMLParagraphElement,
  HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <Radix.Description
    ref={ref}
    className={cn('text-sm leading-relaxed text-nautral-600', className)}
    {...props}
  />
));
AlertDialogDescription.displayName = 'AlertDialogDescription';

export function AlertDialogMedia({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn('mb-2 flex items-center justify-center', className)}>{children}</div>
  );
}

interface ActionProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  destructive?: boolean;
}

export const AlertDialogAction = forwardRef<HTMLButtonElement, ActionProps>(
  ({ className, destructive, children, ...props }, ref) => (
    <Radix.Action
      ref={ref}
      className={cn(
        'inline-flex h-11 items-center justify-center rounded-2xl px-6 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60',
        destructive
          ? 'bg-error text-white shadow-[0_1px_0_rgba(255,255,255,0.2)_inset,0_8px_24px_-8px_rgba(239,68,68,0.45)] hover:brightness-105'
          : 'bg-cta text-white shadow-[0_1px_0_rgba(255,255,255,0.2)_inset,0_8px_24px_-8px_rgba(0,68,185,0.45)] hover:brightness-105',
        className,
      )}
      {...props}
    >
      {children}
    </Radix.Action>
  ),
);
AlertDialogAction.displayName = 'AlertDialogAction';

export const AlertDialogCancel = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, ...props }, ref) => (
  <Radix.Cancel
    ref={ref}
    className={cn(
      'inline-flex h-11 items-center justify-center rounded-2xl border border-kbblue-300/40 bg-white px-6 text-sm font-semibold text-kbblue-700 transition hover:border-kbblue-300/80 hover:bg-kbblue-100/40',
      className,
    )}
    {...props}
  />
));
AlertDialogCancel.displayName = 'AlertDialogCancel';
