import { useMutation, useQueryClient } from '@tanstack/react-query';

import { applyTemplate } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';
import type { ApplyTemplateRequest } from '@/types/templates';

export function useApplyTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ templateId, data }: { templateId: string; data: ApplyTemplateRequest }) =>
      applyTemplate(templateId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.todos.all });
    },
    onError: () => {
      alert('템플릿 적용 중 오류가 발생했습니다. 다시 시도해 주세요.');
    },
  });
}
