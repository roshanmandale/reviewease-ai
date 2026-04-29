'use client';

import { useState, useEffect, useCallback } from 'react';
import { AnalyticsData } from '@/types';
import { getAnalyticsForOwner } from '@/services/logService';

export function useAnalytics(businessIds: string[] = [], days = 14) {
  const [data, setData] = useState<AnalyticsData[]>([]);
  const [loading, setLoading] = useState(true);

  const totalScans = data.reduce((sum, d) => sum + d.scans, 0);
  const totalClicks = data.reduce((sum, d) => sum + d.clicks, 0);
  const conversionRate =
    totalScans > 0 ? Math.round((totalClicks / totalScans) * 100) : 0;

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getAnalyticsForOwner(businessIds, days);
      setData(result);
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
      setData([]);
    } finally {
      setLoading(false);
    }
  }, // eslint-disable-next-line react-hooks/exhaustive-deps
  [businessIds.join(','), days]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  return { data, loading, totalScans, totalClicks, conversionRate, refetch: fetchAnalytics };
}
