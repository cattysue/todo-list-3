import { useQuery } from '@tanstack/react-query';
import { getDashboardTodos } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';
import type { DashboardResponse } from '@/types/dashboard';

export function useDashboard() {
  return useQuery<DashboardResponse, Error>({
    queryKey: queryKeys.todos.dashboard(),
    queryFn: getDashboardTodos,
  });
}
