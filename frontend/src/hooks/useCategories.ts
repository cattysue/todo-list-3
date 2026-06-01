import { useQuery } from '@tanstack/react-query';

import { getCategories } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';

export function useCategories() {
  return useQuery({
    queryKey: queryKeys.categories.all,
    queryFn: getCategories,
    staleTime: 5 * 60 * 1000,
  });
}
