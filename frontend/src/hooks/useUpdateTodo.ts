import { useMutation, useQueryClient } from '@tanstack/react-query';

import { updateTodo } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';
import type { UpdateTodoRequest } from '@/types/todos';

export function useUpdateTodo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTodoRequest }) =>
      updateTodo(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.todos.all });
    },
  });
}
