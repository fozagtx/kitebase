import { useEffect, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { api } from '../api';
import { ApiError } from '../api';
import type { ActivityBucket } from '../types';

interface Props {
  deploymentId: string;
  days?: number;
}

function formatDay(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  return d.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

function totalMessages(buckets: ActivityBucket[]): number {
  let n = 0;
  for (const b of buckets) n += b.user + b.assistant;
  return n;
}

interface TooltipPayloadItem {
  dataKey?: string | number;
  value?: number;
}

function ActivityTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
}) {
  if (!active || !payload || payload.length === 0 || !label) return null;
  const user = payload.find((p) => p.dataKey === 'user')?.value ?? 0;
  const assistant = payload.find((p) => p.dataKey === 'assistant')?.value ?? 0;
  return (
    <div className="rounded-xl bg-white px-3 py-2 text-xs shadow-card">
      <div className="font-semibold text-navy">{formatDay(label)}</div>
      <div className="mt-1 flex items-center gap-2 text-nautral-700">
        <span className="h-2 w-2 rounded-full bg-kbblue-700" />
        you · {user}
      </div>
      <div className="flex items-center gap-2 text-nautral-700">
        <span className="h-2 w-2 rounded-full bg-kbblue-300" />
        actor · {assistant}
      </div>
    </div>
  );
}

export function ActivityChart({ deploymentId, days = 14 }: Props) {
  const [buckets, setBuckets] = useState<ActivityBucket[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    setBuckets(null);
    setError(null);
    api
      .activity(deploymentId, days)
      .then((res) => {
        if (alive) setBuckets(res.buckets);
      })
      .catch((err: unknown) => {
        if (!alive) return;
        setError(err instanceof ApiError ? err.message : 'failed to load activity');
      });
    return () => {
      alive = false;
    };
  }, [deploymentId, days]);

  const total = buckets ? totalMessages(buckets) : 0;

  return (
    <section className="rounded-2xl bg-white p-4 shadow-search">
      <header className="flex items-baseline justify-between">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-wider text-nautral-500">
            activity · last {days} days
          </div>
          <div className="mt-0.5 font-serif text-xl text-navy">
            {buckets === null ? '-' : `${total} messages`}
          </div>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-nautral-600">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-kbblue-700" />
            you
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-kbblue-300" />
            actor
          </span>
        </div>
      </header>
      <div className="mt-3 h-32">
        {error ? (
          <div className="flex h-full items-center justify-center text-xs italic text-error">
            {error}
          </div>
        ) : buckets === null ? (
          <div className="flex h-full items-center justify-center text-xs italic text-nautral-500">
            loading…
          </div>
        ) : total === 0 ? (
          <div className="flex h-full items-center justify-center text-xs italic text-nautral-500">
            no messages yet - say hi in the chat below.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={buckets}
              margin={{ top: 4, right: 4, left: -24, bottom: 0 }}
              barCategoryGap="20%"
            >
              <CartesianGrid
                vertical={false}
                stroke="rgba(0,34,89,0.06)"
                strokeDasharray="2 4"
              />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 10, fill: '#777F8B' }}
                tickFormatter={formatDay}
                interval={Math.max(0, Math.floor(buckets.length / 7) - 1)}
              />
              <YAxis
                allowDecimals={false}
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 10, fill: '#777F8B' }}
                width={28}
              />
              <Tooltip
                cursor={{ fill: 'rgba(189,215,255,0.25)' }}
                content={<ActivityTooltip />}
              />
              <Bar dataKey="user" stackId="m" fill="#2670DC" radius={[0, 0, 0, 0]} />
              <Bar
                dataKey="assistant"
                stackId="m"
                fill="#BDD7FF"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </section>
  );
}
