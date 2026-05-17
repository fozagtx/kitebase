// shadcn-style Input, styled with Charms tokens.
// Matches the rounded-2xl / kbblue-tinted border / shadow-search field used across the app.

import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => (
    <input
      ref={ref}
      type={type ?? 'text'}
      data-slot="input"
      className={cn(
        'flex h-10 w-full rounded-2xl border border-kbblue-300/40 bg-white px-3.5 py-2 text-sm text-navy',
        'placeholder:text-nautral-500 shadow-search transition',
        'focus:border-kbblue-700/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-kbblue-500/40',
        'disabled:cursor-not-allowed disabled:opacity-60',
        'file:border-0 file:bg-transparent file:text-sm file:font-medium',
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = 'Input';
