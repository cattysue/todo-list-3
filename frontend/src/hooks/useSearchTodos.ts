import { useQuery } from '@tanstack/react-query';

import { searchTodos } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';
import { useDebounce } from '@/hooks/useDebounce';
import type { SearchFilters } from '@/types/filters';

export function hasActiveFilters(filters?: SearchFilters): boolean {
  if (!filters) return false;
  return (
    filters.priority !== undefined ||
    filters.due_date_from !== undefined ||
    filters.due_date_to !== undefined ||
    filters.is_completed !== undefined ||
    filters.category_id !== undefined
  );
}

export function useSearchTodos(query: string, filters?: SearchFilters) {
  const debouncedQuery = useDebounce(query, 300);
  const debouncedFilters = useDebounce(filters, 300);

  const result = useQuery({
    queryKey: queryKeys.todos.search(debouncedQuery, debouncedFilters),
    queryFn: () => searchTodos(debouncedQuery, debouncedFilters),
  });

  return { ...result, debouncedQuery };
}
