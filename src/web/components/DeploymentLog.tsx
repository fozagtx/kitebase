// Live deployment event log. Polls /v1/deployments/:id/events every 2s,
// renders a terminal-flavored scrolling pane. All sensitive values are
// scrubbed server-side before they ever reach the wire (see store.sanitizeMessage).

import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../api';
import type { DeploymentEvent } from '../types';
import { InnerTile } from './ui/card';

const KIND_COLOR: Record<string, string> = {
  identity: 'text-kbblue-700',
  deploy: 'text-kbblue-700',
  vultr: 'text-navy',
  'cloud-init': 'text-nautral-700',
  status: 'text-nautral-600',
  telegram: 'text-kbblue-700',
  error: 'text-error',
};

function fmtTime(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

interface Props {
  deploymentId: string;
  active: boolean;
}

export function DeploymentLog({ deploymentId, active }: Props) {
  const [events, setEvents] = useState<DeploymentEvent[]>([]);
  const sinceRef = useRef(0);
  const listRef = useRef<HTMLDivElement | null>(null);

  const tick = useCallback(async () => {
    try {
      const r = await api.deploymentEvents(deploymentId, sinceRef.current);
      if (r.events.length === 0) return;
      sinceRef.current = (r.events[r.events.length - 1]?.ts ?? sinceRef.current) + 1;
      // Dedup by event id — React StrictMode and racing polls can otherwise
      // fetch the same event twice before sinceRef catches up.
      setEvents((prev) => {
        const seen = new Set(prev.map((e) => e.id));
        const fresh = r.events.filter((e) => !seen.has(e.id));
        if (fresh.length === 0) return prev;
        return [...prev, ...fresh].slice(-300);
      });
    } catch {
      // network blip - silently skip
    }
  }, [deploymentId]);

  useEffect(() => {
    setEvents([]);
    sinceRef.current = 0;
    void tick();
    if (!active) return;
    const id = setInterval(() => void tick(), 2000);
    return () => clearInterval(id);
  }, [deploymentId, active, tick]);

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [events.length]);

  return (
    <InnerTile className="p-0">
      <div className="flex items-center justify-between border-b border-kbblue-300/30 px-3 py-2">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
          <div className="text-[10px] font-semibold uppercase tracking-wider text-nautral-600">
            deployment log
          </div>
        </div>
        <div className="text-[10px] text-nautral-500">
          live · {events.length} events · sensitive values redacted
        </div>
      </div>
      <div
        ref={listRef}
        className="max-h-72 overflow-y-auto px-3 py-2 font-mono text-[11px] leading-relaxed text-navy"
      >
        {events.length === 0 ? (
          <div className="text-nautral-500">waiting for the first event…</div>
        ) : (
          events.map((e) => (
            <div key={e.id} className="flex gap-3">
              <span className="shrink-0 text-nautral-500">{fmtTime(e.ts)}</span>
              <span className={`shrink-0 ${KIND_COLOR[e.kind] ?? 'text-nautral-700'}`}>
                [{e.kind}]
              </span>
              <span className="whitespace-pre-wrap break-words text-navy">{e.message}</span>
            </div>
          ))
        )}
      </div>
    </InnerTile>
  );
}
