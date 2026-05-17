import { useEffect, useState } from 'react';

export function usePolling<T>(fetcher: () => Promise<T>, intervalMs = 3000) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;
    const tick = async () => {
      try {
        const next = await fetcher();
        if (!cancelled) setData(next);
      } catch (err) {
        if (!cancelled) setError(err as Error);
      }
    };
    tick();
    const id = setInterval(tick, intervalMs);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [fetcher, intervalMs]);

  return { data, error };
}
