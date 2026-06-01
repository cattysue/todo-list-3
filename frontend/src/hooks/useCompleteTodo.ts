import { useMutation, useQueryClient } from '@tanstack/react-query';
import { completeTodo } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';
import type { DashboardResponse } from '@/types/dashboard';

export function useCompleteTodo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (todoId: string) => completeTodo(todoId),

    onMutate: async (todoId: string) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.todos.dashboard() });

      const previousData = queryClient.getQueryData<DashboardResponse>(
        queryKeys.todos.dashboard(),
      );

      queryClient.setQueryData<DashboardResponse>(
        queryKeys.todos.dashboard(),
        (old) => {
          if (!old) return old;
          const removeItem = (items: typeof old.overdue) =>
            items.filter((i) => i.id !== todoId);
          return {
            overdue: removeItem(old.overdue),
            today: removeItem(old.today),
            tomorrow: removeItem(old.tomorrow),
            this_week: removeItem(old.this_week),
          };
        },
      );

      return { previousData };
    },

    onError: (_err, _todoId, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(
          queryKeys.todos.dashboard(),
          context.previousData,
        );
      } else {
        queryClient.invalidateQueries({ queryKey: queryKeys.todos.dashboard() });
      }
      alert('할일 완료 처리 중 오류가 발생했습니다. 다시 시도해 주세요.');
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.todos.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.stats.all });
    },
  });
}
