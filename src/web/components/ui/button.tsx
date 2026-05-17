// shadcn-style Button port, styled with Charms tokens (cta gradient, kbblue outline).
// Variants: default (cta gradient) | outline (white/kbblue) | ghost | destructive | secondary | link
// Sizes:    default (h-10) | lg (h-11) | sm (h-9) | xs (h-7) | icon variants
// Children with data-icon="inline-start" / "inline-end" get tightened spacing.

import { forwardRef, type ButtonHTMLAttributes, type ElementType } from 'react';
import { Slot } from 'radix-ui';
import { cn } from '../../lib/utils';

type ButtonVariant = 'default' | 'outline' | 'ghost' | 'destructive' | 'secondary' | 'link';
type ButtonSize = 'default' | 'xs' | 'sm' | 'lg' | 'icon' | 'icon-xs' | 'icon-sm' | 'icon-lg';

const baseClasses =
  'inline-flex items-center justify-center gap-2 whitespace-nowrap font-semibold ' +
  'transition outline-none focus-visible:ring-2 focus-visible:ring-kbblue-500/60 ' +
  'focus-visible:ring-offset-2 focus-visible:ring-offset-skeleton ' +
  'disabled:pointer-events-none disabled:opacity-60 ' +
  "[&_[data-icon='inline-start']]:-ms-0.5 [&_[data-icon='inline-end']]:-me-0.5 " +
  '[&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:pointer-events-none';

const variantClasses: Record<ButtonVariant, string> = {
  default:
    'bg-cta text-white shadow-[0_1px_0_rgba(255,255,255,0.2)_inset,0_8px_24px_-8px_rgba(0,68,185,0.45)] hover:brightness-105',
  outline:
    'border border-kbblue-300/40 bg-white text-kbblue-700 shadow-search hover:border-kbblue-300/80 hover:bg-kbblue-100/40',
  ghost: 'text-nautral-600 hover:text-navy hover:bg-white/40',
  destructive:
    'bg-error text-white shadow-[0_1px_0_rgba(255,255,255,0.2)_inset,0_8px_24px_-8px_rgba(239,68,68,0.45)] hover:brightness-105',
  secondary: 'bg-nautral-200 text-navy hover:bg-nautral-300',
  link: 'text-kbblue-700 underline-offset-4 hover:underline',
};

const sizeClasses: Record<ButtonSize, string> = {
  default: 'h-10 px-5 text-sm rounded-2xl',
  xs: 'h-7 px-2.5 text-xs rounded-lg',
  sm: 'h-9 px-3.5 text-sm rounded-xl',
  lg: 'h-11 px-6 text-sm rounded-2xl',
  icon: 'h-10 w-10 rounded-2xl',
  'icon-xs': 'h-7 w-7 rounded-lg',
  'icon-sm': 'h-8 w-8 rounded-lg',
  'icon-lg': 'h-11 w-11 rounded-2xl',
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  asChild?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', asChild = false, type, ...props }, ref) => {
    const Comp: ElementType = asChild ? Slot.Root : 'button';
    return (
      <Comp
        ref={ref}
        data-slot="button"
        className={cn(baseClasses, variantClasses[variant], sizeClasses[size], className)}
        {...(asChild ? {} : { type: type ?? 'button' })}
        {...props}
      />
    );
  },
);
Button.displayName = 'Button';

export function buttonVariants(
  options: { variant?: ButtonVariant; size?: ButtonSize; className?: string } = {},
): string {
  const { variant = 'default', size = 'default', className } = options;
  return cn(baseClasses, variantClasses[variant], sizeClasses[size], className);
}
