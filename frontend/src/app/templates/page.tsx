'use client';

import { useState } from 'react';

import { ApplyTemplateModal } from '@/components/templates/ApplyTemplateModal';
import { TemplateForm } from '@/components/templates/TemplateForm';
import { TemplateList } from '@/components/templates/TemplateList';
import { useApplyTemplate } from '@/hooks/useApplyTemplate';
import { useCreateTemplate } from '@/hooks/useCreateTemplate';
import { useDeleteTemplate } from '@/hooks/useDeleteTemplate';
import { useTemplates } from '@/hooks/useTemplates';

export default function TemplatesPage() {
  const { data: templates = [], isLoading } = useTemplates();
  const createTemplate = useCreateTemplate();
  const deleteTemplate = useDeleteTemplate();
  const applyTemplate = useApplyTemplate();
  const [applyingTemplateId, setApplyingTemplateId] = useState<string | null>(null);

  if (isLoading) return <p className="p-4">로딩 중...</p>;

  return (
    <main className="max-w-2xl mx-auto p-4">
      <h1 className="text-xl font-bold mb-6">할일 묶음 템플릿</h1>

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-4">새 템플릿 만들기</h2>
        <TemplateForm
          onSubmit={(data) => createTemplate.mutate(data)}
          isSubmitting={createTemplate.isPending}
        />
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-4">저장된 템플릿</h2>
        <TemplateList
          templates={templates}
          onApply={(id) => setApplyingTemplateId(id)}
          onDelete={(id) => deleteTemplate.mutate(id)}
          deletingId={deleteTemplate.isPending ? (deleteTemplate.variables ?? null) : null}
          applyingId={applyingTemplateId}
        />
      </section>

      {applyingTemplateId && (
        <ApplyTemplateModal
          onConfirm={(data) => {
            applyTemplate.mutate(
              { templateId: applyingTemplateId, data },
              { onSuccess: () => setApplyingTemplateId(null) },
            );
          }}
          onClose={() => setApplyingTemplateId(null)}
        />
      )}
    </main>
  );
}
