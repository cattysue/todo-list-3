import { useQuery } from '@tanstack/react-query';
import { getCalendarTodos } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';

export function useCalendar(start: string, end: string) {
  return useQuery({
    queryKey: queryKeys.todos.calendar(start, end),
    queryFn: () => getCalendarTodos(start, end),
    staleTime: 60_000,
  });
}
