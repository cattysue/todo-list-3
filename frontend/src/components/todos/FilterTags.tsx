import type { CategoryItem, SearchFilters } from '@/types/filters';

interface FilterTagsProps {
  filters: SearchFilters;
  categories: CategoryItem[];
  onRemove: (key: keyof SearchFilters) => void;
}

const PRIORITY_LABELS: Record<string, string> = {
  high: '높은 우선순위',
  medium: '중간 우선순위',
  low: '낮은 우선순위',
};

interface TagProps {
  label: string;
  onRemove: () => void;
}

function Tag({ label, onRemove }: TagProps) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
      {label}
      <button
        type="button"
        className="ml-1 hover:text-blue-600"
        onClick={onRemove}
        aria-label={`${label} 필터 제거`}
      >
        ×
      </button>
    </span>
  );
}

export default function FilterTags({ filters, categories, onRemove }: FilterTagsProps) {
  const tags: { key: keyof SearchFilters; label: string }[] = [];

  if (filters.priority) {
    tags.push({ key: 'priority', label: PRIORITY_LABELS[filters.priority] ?? filters.priority });
  }
  if (filters.is_completed !== undefined) {
    tags.push({ key: 'is_completed', label: filters.is_completed ? '완료' : '미완료' });
  }
  if (filters.category_id) {
    const cat = categories.find((c) => c.id === filters.category_id);
    tags.push({ key: 'category_id', label: cat ? `카테고리: ${cat.name}` : '카테고리' });
  }
  if (filters.due_date_from) {
    tags.push({ key: 'due_date_from', label: `마감 시작: ${filters.due_date_from}` });
  }
  if (filters.due_date_to) {
    tags.push({ key: 'due_date_to', label: `마감 종료: ${filters.due_date_to}` });
  }

  if (tags.length === 0) return null;

  return (
    <div className="mt-2 flex flex-wrap gap-2" aria-label="적용된 필터">
      {tags.map(({ key, label }) => (
        <Tag key={key} label={label} onRemove={() => onRemove(key)} />
      ))}
    </div>
  );
}
