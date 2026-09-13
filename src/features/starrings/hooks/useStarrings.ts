import { useState, useEffect, useCallback, useMemo } from 'react';
import type { StarringsView } from '../types';
import {
  fetchStarrings,
  toStarringsView,
  getCachedStarrings,
  getStaleStarrings,
  setCachedStarrings,
} from '../services';

interface UseStarringsResult {
  data: StarringsView | null;
  loading: boolean;
  error: string | null;
  lastUpdated: number | null; // ms epoch the data was fetched, or null
  /** True when a fetch failed and we are showing older cached data instead. */
  stale: boolean;
  refetch: () => void; // force a fresh fetch, bypassing the cache
}

/**
 * Load the current Player Starrings, shaped for display.
 *
 * Serves a cached result first so the view paints instantly, then refreshes.
 * If the network (or the CORS bridge behind it) fails, falls back to the last
 * known-good data and flags it as stale rather than blanking a public page —
 * only a failure with nothing cached surfaces as a hard error.
 */
export function useStarrings(): UseStarringsResult {
  const initial = getCachedStarrings();
  const [result, setResult] = useState(initial?.data ?? null);
  const [lastUpdated, setLastUpdated] = useState<number | null>(initial?.timestamp ?? null);
  const [loading, setLoading] = useState(initial === null);
  const [error, setError] = useState<string | null>(null);
  const [stale, setStale] = useState(false);

  const load = useCallback(async (force: boolean) => {
    if (!force) {
      const cached = getCachedStarrings();
      if (cached) {
        setResult(cached.data);
        setLastUpdated(cached.timestamp);
        setError(null);
        setStale(false);
        setLoading(false);
        return;
      }
    }

    setLoading(true);
    setError(null);
    try {
      const fresh = await fetchStarrings();
      const entry = setCachedStarrings(fresh);
      setResult(entry.data);
      setLastUpdated(entry.timestamp);
      setStale(false);
    } catch (err) {
      // Prefer stale data over an error page: the starrings change monthly, so
      // last month's list is far more useful to a visitor than a failure notice.
      const fallback = getStaleStarrings();
      if (fallback) {
        setResult(fallback.data);
        setLastUpdated(fallback.timestamp);
        setStale(true);
        setError(null);
      } else {
        setError(err instanceof Error ? err.message : 'Failed to load Player Starrings');
        setResult(null);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(false);
  }, [load]);

  const data = useMemo(() => (result ? toStarringsView(result) : null), [result]);

  return { data, loading, error, lastUpdated, stale, refetch: () => load(true) };
}
