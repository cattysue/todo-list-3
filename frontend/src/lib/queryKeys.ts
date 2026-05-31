export const queryKeys = {
  todos: {
    all: ['todos'] as const,
    dashboard: () => ['todos', 'dashboard'] as const,
    byCategory: (id: string) => ['todos', 'category', id] as const,
  },
} as const;
