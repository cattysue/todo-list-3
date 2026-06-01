import { useMutation, useQueryClient } from '@tanstack/react-query';

import { deleteTemplate } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';

export function useDeleteTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (templateId: string) => deleteTemplate(templateId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.templates.all });
    },
    onError: () => {
      alert('템플릿 삭제 중 오류가 발생했습니다. 다시 시도해 주세요.');
    },
  });
}
