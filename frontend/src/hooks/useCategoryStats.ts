import { useQuery } from '@tanstack/react-query';
import { getCategoryStats } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';

export function useCategoryStats() {
  return useQuery({
    queryKey: queryKeys.stats.category(),
    queryFn: getCategoryStats,
  });
}
