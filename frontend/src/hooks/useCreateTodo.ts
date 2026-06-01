import { useMutation, useQueryClient } from '@tanstack/react-query';

import { createTodo } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';
import type { CreateTodoRequest } from '@/types/todos';

export function useCreateTodo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateTodoRequest) => createTodo(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.todos.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.stats.all });
    },
  });
}
