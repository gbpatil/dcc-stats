import { useState, useEffect, useCallback } from 'react';
import type { Report, StatsRow } from '../types';
import { fetchReportData } from '../services';

interface UseReportDataResult {
  data: StatsRow[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Hook to fetch data for a specific report
 */
export function useReportData(
  report: Report | null,
  season: number = new Date().getFullYear()
): UseReportDataResult {
  const [data, setData] = useState<StatsRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!report) {
      setData([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const result = await fetchReportData<StatsRow>(report.url, season);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }, [report, season]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}
