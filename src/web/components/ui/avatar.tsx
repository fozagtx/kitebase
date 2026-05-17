// shadcn-style Avatar (Radix Avatar primitive) plus AvatarInitials helper.
// Deterministic background color derived from the source string so each actor
// keeps a stable identity color across renders.

import { forwardRef, type ComponentPropsWithoutRef } from 'react';
import { Avatar as RadixAvatar } from 'radix-ui';
import { cn } from '../../lib/utils';

export const Avatar = forwardRef<
  HTMLSpanElement,
  ComponentPropsWithoutRef<typeof RadixAvatar.Root>
>(({ className, ...props }, ref) => (
  <RadixAvatar.Root
    ref={ref}
    data-slot="avatar"
    className={cn(
      'relative flex h-9 w-9 shrink-0 overflow-hidden rounded-full',
      className,
    )}
    {...props}
  />
));
Avatar.displayName = 'Avatar';

export const AvatarImage = forwardRef<
  HTMLImageElement,
  ComponentPropsWithoutRef<typeof RadixAvatar.Image>
>(({ className, ...props }, ref) => (
  <RadixAvatar.Image
    ref={ref}
    data-slot="avatar-image"
    className={cn('aspect-square h-full w-full object-cover', className)}
    {...props}
  />
));
AvatarImage.displayName = 'AvatarImage';

export const AvatarFallback = forwardRef<
  HTMLSpanElement,
  ComponentPropsWithoutRef<typeof RadixAvatar.Fallback>
>(({ className, ...props }, ref) => (
  <RadixAvatar.Fallback
    ref={ref}
    data-slot="avatar-fallback"
    className={cn(
      'flex h-full w-full items-center justify-center text-xs font-semibold text-white',
      className,
    )}
    {...props}
  />
));
AvatarFallback.displayName = 'AvatarFallback';

// Eight kbblue/navy-family tints - keeps avatars on-brand.
const palette = [
  '#0042AB',
  '#155DFC',
  '#2670DC',
  '#79ADF8',
  '#3F4A61',
  '#002259',
  '#5F6B7C',
  '#0DDE53',
];

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i += 1) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function colorForSeed(seed: string): string {
  if (seed.length === 0) return palette[0] as string;
  return palette[hashString(seed) % palette.length] as string;
}

export function initials(name: string): string {
  const cleaned = name.trim();
  if (!cleaned) return '?';
  const parts = cleaned.split(/\s+/);
  if (parts.length === 1) return cleaned.slice(0, 2).toUpperCase();
  return `${parts[0]?.[0] ?? ''}${parts[parts.length - 1]?.[0] ?? ''}`.toUpperCase();
}

interface InitialsProps {
  name: string;
  className?: string;
}

// AvatarInitials: deterministic-color fallback driven by the actor's name.
export function AvatarInitials({ name, className }: InitialsProps) {
  return (
    <AvatarFallback
      className={className}
      style={{ backgroundColor: colorForSeed(name) }}
    >
      {initials(name)}
    </AvatarFallback>
  );
}
