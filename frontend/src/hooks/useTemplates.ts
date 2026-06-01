import { useQuery } from '@tanstack/react-query';

import { getTemplates } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';

export function useTemplates() {
  return useQuery({
    queryKey: queryKeys.templates.all,
    queryFn: getTemplates,
  });
}
