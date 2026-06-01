import type { CategoryItem, SearchFilters } from '@/types/filters';

interface FilterBarProps {
  filters: SearchFilters;
  onFilterChange: (filters: SearchFilters) => void;
  categories: CategoryItem[];
}

function getThisWeekRange(): { due_date_from: string; due_date_to: string } {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(today);
  monday.setDate(today.getDate() + daysToMonday);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const fmt = (d: Date) =>
    [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-');
  return { due_date_from: fmt(monday), due_date_to: fmt(sunday) };
}

export default function FilterBar({ filters, onFilterChange, categories }: FilterBarProps) {
  const handleChange = (patch: Partial<SearchFilters>) => {
    const next = { ...filters, ...patch };
    // undefined 값 키 제거
    (Object.keys(next) as Array<keyof SearchFilters>).forEach((k) => {
      if (next[k] === undefined || next[k] === '') {
        delete next[k];
      }
    });
    onFilterChange(next);
  };

  const handleIsCompletedChange = (value: string) => {
    if (value === '') {
      const { is_completed: _removed, ...rest } = filters;
      onFilterChange(rest);
    } else {
      handleChange({ is_completed: value === 'true' });
    }
  };

  const handleThisWeek = () => {
    const range = getThisWeekRange();
    handleChange(range);
  };

  return (
    <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200 space-y-3">
      <div className="flex flex-wrap gap-3">
        {/* 우선순위 */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-600">우선순위</label>
          <select
            className="text-sm border border-gray-300 rounded px-2 py-1 bg-white"
            value={filters.priority ?? ''}
            onChange={(e) =>
              handleChange({
                priority: e.target.value
                  ? (e.target.value as SearchFilters['priority'])
                  : undefined,
              })
            }
            aria-label="우선순위 필터"
          >
            <option value="">전체</option>
            <option value="high">높음</option>
            <option value="medium">중간</option>
            <option value="low">낮음</option>
          </select>
        </div>

        {/* 완료 여부 */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-600">완료 여부</label>
          <select
            className="text-sm border border-gray-300 rounded px-2 py-1 bg-white"
            value={filters.is_completed === undefined ? '' : String(filters.is_completed)}
            onChange={(e) => handleIsCompletedChange(e.target.value)}
            aria-label="완료 여부 필터"
          >
            <option value="">전체</option>
            <option value="false">미완료</option>
            <option value="true">완료</option>
          </select>
        </div>

        {/* 카테고리 */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-600">카테고리</label>
          <select
            className="text-sm border border-gray-300 rounded px-2 py-1 bg-white"
            value={filters.category_id ?? ''}
            onChange={(e) =>
              handleChange({ category_id: e.target.value || undefined })
            }
            aria-label="카테고리 필터"
          >
            <option value="">전체</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 마감일 범위 */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-600">마감일 시작</label>
          <input
            type="date"
            className="text-sm border border-gray-300 rounded px-2 py-1 bg-white"
            value={filters.due_date_from ?? ''}
            onChange={(e) =>
              handleChange({ due_date_from: e.target.value || undefined })
            }
            aria-label="마감일 시작"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-600">마감일 종료</label>
          <input
            type="date"
            className="text-sm border border-gray-300 rounded px-2 py-1 bg-white"
            value={filters.due_date_to ?? ''}
            onChange={(e) =>
              handleChange({ due_date_to: e.target.value || undefined })
            }
            aria-label="마감일 종료"
          />
        </div>
        <button
          type="button"
          className="text-sm px-3 py-1 rounded bg-blue-100 text-blue-700 hover:bg-blue-200"
          onClick={handleThisWeek}
        >
          이번 주
        </button>
      </div>
    </div>
  );
}
