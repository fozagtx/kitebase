// Minimal shadcn-style Sidebar composition. Same primitive names + composition
// pattern as @shadcn/ui sidebar - sized down for kitebase, styled with Charms tokens.

import {
  createContext,
  forwardRef,
  useContext,
  useEffect,
  useState,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type ReactNode,
} from 'react';
import { cn } from '../../lib/utils';

interface SidebarCtx {
  open: boolean;
  toggle: () => void;
  setOpen: (v: boolean) => void;
}
const SidebarContext = createContext<SidebarCtx | null>(null);

export function useSidebar(): SidebarCtx {
  const ctx = useContext(SidebarContext);
  if (!ctx) throw new Error('useSidebar must be used inside <SidebarProvider>');
  return ctx;
}

export function SidebarProvider({
  children,
  defaultOpen = true,
}: {
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  return (
    <SidebarContext.Provider value={{ open, toggle: () => setOpen((v) => !v), setOpen }}>
      <div className="flex h-full min-h-0">{children}</div>
    </SidebarContext.Provider>
  );
}

export function Sidebar({ className, children }: { className?: string; children: ReactNode }) {
  const { open } = useSidebar();
  return (
    <aside
      data-state={open ? 'expanded' : 'collapsed'}
      className={cn(
        'flex h-full flex-col border-r border-[#ECEDF0] transition-all duration-300 ease-out',
        open ? 'w-[260px]' : 'w-0 overflow-hidden',
        className,
      )}
    >
      {children}
    </aside>
  );
}

export function SidebarInset({ className, children }: { className?: string; children: ReactNode }) {
  return <main className={cn('flex h-full min-w-0 flex-1 flex-col', className)}>{children}</main>;
}

export function SidebarHeader({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn('px-5 pb-2 pt-6', className)}>{children}</div>;
}

export function SidebarFooter({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn('mt-auto px-5 pb-5', className)}>{children}</div>;
}

export function SidebarContent({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cn('flex flex-1 min-h-0 flex-col gap-4 overflow-y-auto px-3', className)}>
      {children}
    </div>
  );
}

export function SidebarGroup({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn('flex flex-col gap-2', className)}>{children}</div>;
}

export function SidebarGroupLabel({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        'px-2 text-[11px] font-semibold uppercase tracking-wider text-nautral-500',
        className,
      )}
    >
      {children}
    </div>
  );
}

export function SidebarGroupAction({
  className,
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode }) {
  return (
    <button
      className={cn(
        'ml-auto rounded-full p-1 text-nautral-500 transition hover:bg-kbblue-100/40 hover:text-navy',
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

export function SidebarGroupContent({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return <div className={cn('flex flex-col gap-1', className)}>{children}</div>;
}

export function SidebarMenu({ className, children }: { className?: string; children: ReactNode }) {
  return <ul className={cn('flex flex-col gap-1', className)}>{children}</ul>;
}

export function SidebarMenuItem({
  className,
  children,
}: HTMLAttributes<HTMLLIElement>) {
  return <li className={cn(className)}>{children}</li>;
}

interface SidebarMenuButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  isActive?: boolean;
  size?: 'sm' | 'md';
}

export const SidebarMenuButton = forwardRef<HTMLButtonElement, SidebarMenuButtonProps>(
  ({ className, isActive, size = 'md', children, ...rest }, ref) => {
    return (
      <button
        ref={ref}
        data-active={isActive ? 'true' : undefined}
        className={cn(
          'group/menu-button flex w-full items-center gap-2 rounded-full px-3 text-left transition',
          size === 'sm' ? 'py-2 text-xs' : 'py-2.5 text-sm',
          isActive
            ? 'bg-kbblue-700/10 text-navy'
            : 'text-nautral-600 hover:bg-kbblue-100/40 hover:text-navy',
          className,
        )}
        {...rest}
      >
        {children}
      </button>
    );
  },
);
SidebarMenuButton.displayName = 'SidebarMenuButton';

export function SidebarMenuBadge({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        'ml-auto rounded-full bg-kbblue-100 px-1.5 py-0.5 text-[10px] font-semibold text-kbblue-700',
        className,
      )}
    >
      {children}
    </span>
  );
}

export function SidebarTrigger({ className }: { className?: string }) {
  const { toggle } = useSidebar();
  return (
    <button
      onClick={toggle}
      className={cn(
        'inline-flex h-9 w-9 items-center justify-center rounded-full text-nautral-600 transition hover:bg-kbblue-100/40 hover:text-navy',
        className,
      )}
      aria-label="toggle sidebar"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <line x1="9" y1="3" x2="9" y2="21" />
      </svg>
    </button>
  );
}
