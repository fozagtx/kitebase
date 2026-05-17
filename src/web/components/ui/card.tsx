// shadcn-style Card port, styled with Charms tokens.
// Composition mirrors @shadcn/ui:
//   Card
//   ├── CardHeader
//   │   ├── CardTitle
//   │   ├── CardDescription
//   │   └── CardAction
//   ├── CardContent
//   └── CardFooter

import { forwardRef, type ElementType, type HTMLAttributes } from 'react';
import { Slot } from 'radix-ui';
import { cn } from '../../lib/utils';

type CardSize = 'default' | 'sm';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  size?: CardSize;
  asChild?: boolean;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, size = 'default', asChild = false, ...props }, ref) => {
    const Comp: ElementType = asChild ? Slot.Root : 'div';
    return (
      <Comp
        ref={ref}
        data-slot="card"
        data-size={size}
        className={cn(
          'flex flex-col rounded-3xl bg-skeleton text-navy shadow-card',
          size === 'sm' ? 'gap-4 p-5' : 'gap-6 p-7',
          className,
        )}
        {...props}
      />
    );
  },
);
Card.displayName = 'Card';

export const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="card-header"
      className={cn(
        'grid auto-rows-min grid-rows-[auto_auto] items-start gap-1.5',
        'has-[[data-slot=card-action]]:grid-cols-[1fr_auto]',
        className,
      )}
      {...props}
    />
  ),
);
CardHeader.displayName = 'CardHeader';

export const CardTitle = forwardRef<HTMLHeadingElement, HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      data-slot="card-title"
      className={cn('font-serif text-2xl leading-tight text-navy', className)}
      style={{ letterSpacing: '-0.025em' }}
      {...props}
    />
  ),
);
CardTitle.displayName = 'CardTitle';

export const CardDescription = forwardRef<
  HTMLParagraphElement,
  HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    data-slot="card-description"
    className={cn('text-sm leading-relaxed text-nautral-600', className)}
    {...props}
  />
));
CardDescription.displayName = 'CardDescription';

export const CardAction = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="card-action"
      className={cn('col-start-2 row-span-2 row-start-1 self-start justify-self-end', className)}
      {...props}
    />
  ),
);
CardAction.displayName = 'CardAction';

export const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="card-content"
      className={cn('text-sm leading-relaxed text-nautral-700', className)}
      {...props}
    />
  ),
);
CardContent.displayName = 'CardContent';

export const CardFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="card-footer"
      className={cn('flex items-center gap-3', className)}
      {...props}
    />
  ),
);
CardFooter.displayName = 'CardFooter';

// InnerTile: the white pill used inside Cards (stats, connected-wallet chip, chat input row).
export const InnerTile = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="card-inner-tile"
      className={cn('rounded-2xl bg-white shadow-search', className)}
      {...props}
    />
  ),
);
InnerTile.displayName = 'InnerTile';
