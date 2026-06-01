import type { Template } from '@/types/templates';

interface Props {
  templates: Template[];
  onApply: (templateId: string) => void;
  onDelete: (templateId: string) => void;
  deletingId: string | null;
  applyingId: string | null;
}

export function TemplateList({ templates, onApply, onDelete, deletingId, applyingId }: Props) {
  if (templates.length === 0) {
    return <p className="text-gray-500">저장된 템플릿이 없습니다.</p>;
  }
  return (
    <ul className="space-y-4">
      {templates.map((tmpl) => (
        <li key={tmpl.id} className="border rounded p-4">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-semibold">{tmpl.name}</h3>
            <div className="flex gap-2">
              <button
                onClick={() => onApply(tmpl.id)}
                disabled={applyingId === tmpl.id}
                className="px-3 py-1 text-sm bg-blue-600 text-white rounded disabled:opacity-50"
              >
                불러오기
              </button>
              <button
                onClick={() => onDelete(tmpl.id)}
                disabled={deletingId === tmpl.id}
                className="px-3 py-1 text-sm text-red-600 border border-red-300 rounded disabled:opacity-50"
              >
                삭제
              </button>
            </div>
          </div>
          <p className="text-sm text-gray-500">{tmpl.items.length}개 할일</p>
        </li>
      ))}
    </ul>
  );
}
