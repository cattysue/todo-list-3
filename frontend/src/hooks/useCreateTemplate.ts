import { useMutation, useQueryClient } from '@tanstack/react-query';

import { createTemplate } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';

export function useCreateTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.templates.all });
    },
    onError: () => {
      alert('템플릿 생성 중 오류가 발생했습니다. 다시 시도해 주세요.');
    },
  });
}
