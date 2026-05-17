import { useCallback, useEffect, useState } from 'react';
import { api } from '../api';
import { usePolling } from '../hooks/usePolling';
import { Sidebar } from '../components/Sidebar';
import { EmptyState } from '../components/EmptyState';
import { ActorDetail } from '../components/ActorDetail';
import { DeployView } from '../components/DeployView';
import { Dialog, DialogContent } from '../components/ui/dialog';
import { SidebarInset, SidebarProvider } from '../components/ui/sidebar';
import type { Deployment } from '../types';

export function Workspace() {
  const fetcher = useCallback(async () => (await api.listDeployments()).items, []);
  const { data: deployments } = usePolling<Deployment[]>(fetcher, 4000);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [deployOpen, setDeployOpen] = useState(false);

  useEffect(() => {
    if (selectedId === null && deployments && deployments.length > 0) {
      setSelectedId(deployments[0]!.id);
    }
  }, [deployments, selectedId]);

  useEffect(() => {
    if (selectedId && deployments) {
      const found = deployments.find((d) => d.id === selectedId);
      if (!found) setSelectedId(deployments[0]?.id ?? null);
    }
  }, [deployments, selectedId]);

  const list = deployments ?? [];
  const selected = selectedId ? list.find((d) => d.id === selectedId) ?? null : null;

  function onDeployed(d: Deployment) {
    setSelectedId(d.id);
    setDeployOpen(false);
    fetcher().catch(() => undefined);
  }

  return (
    <SidebarProvider>
      <Sidebar
        deployments={list}
        selectedView={selectedId}
        deployActive={deployOpen}
        onSelect={setSelectedId}
        onNewActor={() => setDeployOpen(true)}
      />
      <SidebarInset>
        {list.length === 0 ? (
          <EmptyState onDeploy={() => setDeployOpen(true)} />
        ) : selected ? (
          <ActorDetail
            deployment={selected}
            onDestroyed={() => fetcher().catch(() => undefined)}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-nautral-500">
            Select an actor from the sidebar
          </div>
        )}
      </SidebarInset>

      <Dialog open={deployOpen} onOpenChange={setDeployOpen}>
        <DialogContent>
          <DeployView onDeployed={onDeployed} onCancel={() => setDeployOpen(false)} />
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
}
