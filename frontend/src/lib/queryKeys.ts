import type { SearchFilters } from '@/types/filters';

export const queryKeys = {
  todos: {
    all: ['todos'] as const,
    dashboard: () => ['todos', 'dashboard'] as const,
    byCategory: (id: string) => ['todos', 'category', id] as const,
    search: (q: string, filters?: SearchFilters) =>
      ['todos', 'search', q, filters ?? {}] as const,
    calendar: (start: string, end: string) => ['todos', 'calendar', start, end] as const,
  },
  categories: {
    all: ['categories'] as const,
  },
  templates: {
    all: ['templates'] as const,
  },
  stats: {
    all: ['stats'] as const,
    completion: (period: string, count: number) => ['stats', 'completion', period, count] as const,
    category: () => ['stats', 'category'] as const,
  },
} as const;
