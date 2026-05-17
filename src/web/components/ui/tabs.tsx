// shadcn-style Tabs (Radix Tabs primitive) tuned to the Charms voice.
//   TabsList    - bg-white pill with shadow-search, p-1
//   TabsTrigger - rounded-xl, active state lifts to bg-skeleton + shadow-card
//   TabsContent - pt-5 above the panel content

import { forwardRef, type ComponentPropsWithoutRef } from 'react';
import { Tabs as RadixTabs } from 'radix-ui';
import { cn } from '../../lib/utils';

export const Tabs = RadixTabs.Root;

export const TabsList = forwardRef<
  HTMLDivElement,
  ComponentPropsWithoutRef<typeof RadixTabs.List>
>(({ className, ...props }, ref) => (
  <RadixTabs.List
    ref={ref}
    data-slot="tabs-list"
    className={cn(
      'inline-flex h-10 items-center justify-center gap-1 rounded-2xl bg-white p-1 shadow-search',
      className,
    )}
    {...props}
  />
));
TabsList.displayName = 'TabsList';

export const TabsTrigger = forwardRef<
  HTMLButtonElement,
  ComponentPropsWithoutRef<typeof RadixTabs.Trigger>
>(({ className, ...props }, ref) => (
  <RadixTabs.Trigger
    ref={ref}
    data-slot="tabs-trigger"
    className={cn(
      'inline-flex h-8 items-center justify-center gap-2 whitespace-nowrap rounded-xl px-3 text-sm font-semibold',
      'text-nautral-600 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kbblue-500/60',
      'hover:text-navy',
      'data-[state=active]:bg-skeleton data-[state=active]:text-navy data-[state=active]:shadow-card',
      'disabled:pointer-events-none disabled:opacity-50',
      className,
    )}
    {...props}
  />
));
TabsTrigger.displayName = 'TabsTrigger';

export const TabsContent = forwardRef<
  HTMLDivElement,
  ComponentPropsWithoutRef<typeof RadixTabs.Content>
>(({ className, ...props }, ref) => (
  <RadixTabs.Content
    ref={ref}
    data-slot="tabs-content"
    className={cn(
      'pt-5 focus-visible:outline-none',
      className,
    )}
    {...props}
  />
));
TabsContent.displayName = 'TabsContent';
