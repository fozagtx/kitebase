// shadcn-style Dialog (Radix Dialog) styled with Charms tokens.
// Click outside the content (anywhere on the overlay) closes it - that's the
// default Radix Dialog behavior, in contrast to AlertDialog which traps the user.

import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { Dialog as Radix } from 'radix-ui';
import { cn } from '../../lib/utils';

export const Dialog = Radix.Root;
export const DialogTrigger = Radix.Trigger;
export const DialogPortal = Radix.Portal;
export const DialogClose = Radix.Close;

export const DialogOverlay = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <Radix.Overlay
      ref={ref}
      data-slot="dialog-overlay"
      className={cn(
        'fixed inset-0 z-50 bg-navy/20 backdrop-blur-md',
        'data-[state=open]:animate-in data-[state=closed]:animate-out',
        'data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0',
        className,
      )}
      {...props}
    />
  ),
);
DialogOverlay.displayName = 'DialogOverlay';

interface ContentProps extends HTMLAttributes<HTMLDivElement> {
  showCloseButton?: boolean;
}

export const DialogContent = forwardRef<HTMLDivElement, ContentProps>(
  ({ className, children, ...props }, ref) => (
    <DialogPortal>
      <DialogOverlay />
      <Radix.Content
        ref={ref}
        data-slot="dialog-content"
        className={cn(
          'fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2',
          'w-full max-w-lg rounded-3xl bg-skeleton p-0 shadow-card focus:outline-none',
          'data-[state=open]:animate-in data-[state=closed]:animate-out',
          'data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95',
          className,
        )}
        {...props}
      >
        {children}
      </Radix.Content>
    </DialogPortal>
  ),
);
DialogContent.displayName = 'DialogContent';

export function DialogHeader({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return <div className={cn('flex flex-col gap-1.5', className)}>{children}</div>;
}

export function DialogFooter({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn('flex items-center justify-between gap-3', className)}>{children}</div>
  );
}

export const DialogTitle = forwardRef<HTMLHeadingElement, HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <Radix.Title
      ref={ref}
      data-slot="dialog-title"
      className={cn('font-serif text-2xl text-navy', className)}
      style={{ letterSpacing: '-0.025em' }}
      {...props}
    />
  ),
);
DialogTitle.displayName = 'DialogTitle';

export const DialogDescription = forwardRef<
  HTMLParagraphElement,
  HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <Radix.Description
    ref={ref}
    data-slot="dialog-description"
    className={cn('text-sm leading-relaxed text-nautral-600', className)}
    {...props}
  />
));
DialogDescription.displayName = 'DialogDescription';
