import { useMutation, useQueryClient } from '@tanstack/react-query';
import { controlRecurrence, type RecurrenceAction } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';

export function useRecurrenceControl() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, action }: { id: string; action: RecurrenceAction }) =>
      controlRecurrence(id, action),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.todos.all });
    },
    onError: () => {
      alert('반복 설정 변경 중 오류가 발생했습니다. 다시 시도해 주세요.');
    },
  });
}
