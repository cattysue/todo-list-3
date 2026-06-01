'use client';

import { useState } from 'react';

import { useSearchTodos, hasActiveFilters } from '@/hooks/useSearchTodos';
import { useCategories } from '@/hooks/useCategories';
import SearchBar from '@/components/todos/SearchBar';
import FilterBar from '@/components/todos/FilterBar';
import FilterTags from '@/components/todos/FilterTags';
import TodoModal from '@/components/todos/TodoModal';
import type { TodoDashboardItem } from '@/types/dashboard';
import type { TodoItem } from '@/types/todos';
import type { SearchFilters } from '@/types/filters';

function SearchResultItem({
  item,
  onEdit,
}: {
  item: TodoDashboardItem;
  onEdit: (item: TodoDashboardItem) => void;
}) {
  const priorityLabel: Record<string, string> = {
    high: '높음',
    medium: '중간',
    low: '낮음',
  };

  return (
    <li className="py-3 border-b border-gray-100 last:border-0">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="font-medium text-gray-900">{item.title}</div>
          <div className="mt-1 flex flex-wrap gap-3 text-sm text-gray-500">
            {item.due_date && <span>마감: {String(item.due_date)}</span>}
            {item.priority && (
              <span>우선순위: {priorityLabel[item.priority] ?? item.priority}</span>
            )}
            {item.category_name && (
              <span className="text-blue-600">{item.category_name}</span>
            )}
            {item.is_completed && <span className="text-green-600">완료</span>}
          </div>
        </div>
        <button
          type="button"
          onClick={() => onEdit(item)}
          className="shrink-0 p-1 text-gray-400 hover:text-blue-600 rounded transition-colors"
          aria-label="할일 수정"
        >
          ✏️
        </button>
      </div>
    </li>
  );
}

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<SearchFilters>({});
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<TodoItem | undefined>(undefined);

  const { data: results = [], isFetching, isError, debouncedQuery } = useSearchTodos(
    query,
    filters,
  );
  const { data: categories = [] } = useCategories();

  const isActive = !!debouncedQuery || hasActiveFilters(filters);

  const handleRemoveFilter = (key: keyof SearchFilters) => {
    setFilters((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const handleOpenCreate = () => {
    setEditTarget(undefined);
    setModalOpen(true);
  };

  const handleEdit = (item: TodoDashboardItem) => {
    // TodoDashboardItem을 TodoItem으로 변환 (recurrence 필드는 null로 초기화)
    const todoItem: TodoItem = {
      ...item,
      recurrence_type: null,
      recurrence_days: null,
      recurrence_day_of_month: null,
    };
    setEditTarget(todoItem);
    setModalOpen(true);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setEditTarget(undefined);
  };

  return (
    <main className="p-4 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">할일 검색</h1>
        <button
          type="button"
          onClick={handleOpenCreate}
          className="px-3 py-1.5 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
        >
          + 할일 추가
        </button>
      </div>

      <SearchBar value={query} onChange={setQuery} />

      <FilterBar
        filters={filters}
        onFilterChange={setFilters}
        categories={categories}
      />

      <FilterTags
        filters={filters}
        categories={categories}
        onRemove={handleRemoveFilter}
      />

      <div className="mt-4">
        {isFetching && (
          <p className="text-gray-500 text-center py-8">검색 중...</p>
        )}

        {isError && (
          <p className="text-red-600 text-center py-8">
            검색 중 오류가 발생했습니다. 다시 시도해 주세요.
          </p>
        )}

        {!isFetching && !isError && isActive && results.length === 0 && (
          <p className="text-gray-500 text-center py-8">검색 결과 없음</p>
        )}

        {!isFetching && !isError && results.length > 0 && (
          <ul className="divide-y divide-gray-100 bg-white rounded-lg border border-gray-200">
            {results.map((item) => (
              <SearchResultItem key={item.id} item={item} onEdit={handleEdit} />
            ))}
          </ul>
        )}
      </div>

      <TodoModal
        isOpen={modalOpen}
        onClose={handleModalClose}
        initialData={editTarget}
      />
    </main>
  );
}
