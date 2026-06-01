import { useQuery } from '@tanstack/react-query';
import { getCompletionStats } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';
import type { StatsPeriod } from '@/types/stats';

export function useCompletionStats(period: StatsPeriod) {
  const count = period === 'weekly' ? 8 : 6;
  return useQuery({
    queryKey: queryKeys.stats.completion(period, count),
    queryFn: () => getCompletionStats(period, count),
    staleTime: 5 * 60 * 1000,
  });
}
