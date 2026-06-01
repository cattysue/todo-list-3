import { useQuery } from '@tanstack/react-query';
import { searchTodos } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';
import { useDebounce } from '@/hooks/useDebounce';

export function useSearchTodos(query: string) {
  const debouncedQuery = useDebounce(query, 300);

  const result = useQuery({
    queryKey: queryKeys.todos.search(debouncedQuery),
    queryFn: () => searchTodos(debouncedQuery),
    enabled: !!debouncedQuery,
  });

  return { ...result, debouncedQuery };
}
