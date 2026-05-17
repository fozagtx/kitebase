import { useState } from 'react';
import { useAuth } from '../auth';
import { KiteConnectButton } from './KiteConnectButton';
import { KitebaseLogo } from './KitebaseLogo';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alertDialog';
import { Button } from './ui/button';
import {
  Sidebar as SidebarShell,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from './ui/sidebar';
import { StatusDot } from './ui/statusBadge';
import type { Deployment } from '../types';

interface Props {
  deployments: Deployment[];
  selectedView: string | null;
  deployActive?: boolean;
  onSelect: (id: string) => void;
  onNewActor: () => void;
}

function shortName(v: string): string {
  return v.length > 18 ? `${v.slice(0, 16)}…` : v;
}

export function Sidebar({ deployments, selectedView, deployActive, onSelect, onNewActor }: Props) {
  const { user, logout } = useAuth();
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  async function confirmLogout() {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await logout();
      setLogoutOpen(false);
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <SidebarShell>
      <SidebarHeader>
        <KitebaseLogo size={32} withWordmark wordmarkSize={26} />
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup className="pt-2">
          <KiteConnectButton />
        </SidebarGroup>

        <SidebarGroup>
          <Button
            variant="outline"
            onClick={onNewActor}
            className={
              deployActive
                ? 'h-auto w-full justify-start gap-2 border-kbblue-300 px-4 py-3.5 text-kbblue-900'
                : 'h-auto w-full justify-start gap-2 px-4 py-3.5'
            }
          >
            <span className="text-lg leading-none">＋</span>
            <span>deploy new actor</span>
          </Button>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>actors</SidebarGroupLabel>
          <SidebarGroupContent>
            {deployments.length === 0 ? (
              <div className="px-2 py-2 text-xs text-nautral-500">no actors yet</div>
            ) : (
              <SidebarMenu>
                {deployments.map((d) => (
                  <SidebarMenuItem key={d.id}>
                    <SidebarMenuButton
                      isActive={selectedView === d.id}
                      onClick={() => onSelect(d.id)}
                    >
                      <StatusDot status={d.status} />
                      <span className="truncate font-semibold">
                        {shortName(d.identity.agentName)}
                      </span>
                      <span className="ml-auto text-[10px] text-nautral-500">{d.status}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            )}
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0 flex-1 truncate text-xs text-nautral-600">
            {user?.email ?? '-'}
          </div>
          <Button
            variant="link"
            size="xs"
            className="h-auto p-0 text-xs text-nautral-500 hover:text-navy"
            onClick={() => setLogoutOpen(true)}
          >
            log out
          </Button>
        </div>
      </SidebarFooter>

      <AlertDialog open={logoutOpen} onOpenChange={setLogoutOpen}>
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Log out of kitebase?</AlertDialogTitle>
            <AlertDialogDescription>
              Your actors keep running. You'll just need to sign back in to see them.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loggingOut}>Stay signed in</AlertDialogCancel>
            <AlertDialogAction
              destructive
              disabled={loggingOut}
              onClick={(e) => {
                e.preventDefault();
                void confirmLogout();
              }}
            >
              {loggingOut ? 'logging out…' : 'Log out'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SidebarShell>
  );
}
