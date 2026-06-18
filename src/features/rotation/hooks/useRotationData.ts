import { useState, useEffect, useCallback } from 'react';
import type { RotationData } from '../types';
import { buildRotationData, getCachedRotation, setCachedRotation } from '../services';

interface UseRotationDataResult {
  data: RotationData | null;
  loading: boolean;
  error: string | null;
  lastUpdated: number | null; // ms epoch the data was fetched, or null
  refetch: () => void; // force a fresh fetch, bypassing the cache
}

/**
 * Hook to fetch and compute the fair-rotation data for a given season.
 *
 * Reads from a TTL cache first (see rotationCache) so reopening the tab does not
 * refetch; `refetch` forces a fresh network load and updates the cache.
 */
export function useRotationData(
  season: number = new Date().getFullYear(),
): UseRotationDataResult {
  const initial = getCachedRotation(season);
  const [data, setData] = useState<RotationData | null>(initial?.data ?? null);
  const [lastUpdated, setLastUpdated] = useState<number | null>(initial?.timestamp ?? null);
  const [loading, setLoading] = useState(initial === null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (force: boolean) => {
      if (!force) {
        const cached = getCachedRotation(season);
        if (cached) {
          setData(cached.data);
          setLastUpdated(cached.timestamp);
          setError(null);
          setLoading(false);
          return;
        }
      }

      setLoading(true);
      setError(null);
      try {
        const fresh = await buildRotationData(season);
        const entry = setCachedRotation(season, fresh);
        setData(entry.data);
        setLastUpdated(entry.timestamp);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load rotation data');
        setData(null);
      } finally {
        setLoading(false);
      }
    },
    [season],
  );

  useEffect(() => {
    load(false);
  }, [load]);

  return { data, loading, error, lastUpdated, refetch: () => load(true) };
}
