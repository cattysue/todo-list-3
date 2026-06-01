import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateTodoDueDate } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';
import type { TodoCalendarItem } from '@/types/calendar';

interface DragDueDateVars {
  todoId: string;
  newDueDate: string;
  previousDueDate: string;
  calendarStart: string;
  calendarEnd: string;
}

export function useDragDueDate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ todoId, newDueDate }: DragDueDateVars) =>
      updateTodoDueDate(todoId, newDueDate),

    onMutate: async ({ todoId, newDueDate, calendarStart, calendarEnd }) => {
      const calendarKey = queryKeys.todos.calendar(calendarStart, calendarEnd);
      await queryClient.cancelQueries({ queryKey: calendarKey });

      const previousData = queryClient.getQueryData<TodoCalendarItem[]>(calendarKey);

      queryClient.setQueryData<TodoCalendarItem[]>(calendarKey, (old) => {
        if (!old) return old;
        return old.map((todo) =>
          todo.id === todoId ? { ...todo, due_date: newDueDate } : todo,
        );
      });

      return { previousData, calendarKey };
    },

    onError: (_err, _vars, context) => {
      if (context?.previousData !== undefined) {
        queryClient.setQueryData(context.calendarKey, context.previousData);
      } else if (context?.calendarKey) {
        queryClient.invalidateQueries({ queryKey: context.calendarKey });
      }
      alert('마감일 변경 중 오류가 발생했습니다. 다시 시도해 주세요.');
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.todos.all });
    },
  });
}
