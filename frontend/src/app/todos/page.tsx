'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { searchTodos, completeTodo } from '@/lib/api';
import TodoModal from '@/components/todos/TodoModal';
import type { TodoItem } from '@/types/todos';

type FilterStatus = 'all' | 'pending' | 'completed';
type FilterPriority = '' | 'high' | 'medium' | 'low';

const PRIORITY_LABEL: Record<string, string> = {
  high: '높음',
  medium: '중간',
  low: '낮음',
};

const PRIORITY_COLOR: Record<string, string> = {
  high: 'text-red-600 bg-red-50 border border-red-200',
  medium: 'text-yellow-600 bg-yellow-50 border border-yellow-200',
  low: 'text-green-600 bg-green-50 border border-green-200',
};

const RECURRENCE_LABEL: Record<string, string> = {
  daily: '매일',
  weekly: '매주',
  monthly: '매월',
};

export default function TodosPage() {
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [filterPriority, setFilterPriority] = useState<FilterPriority>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTodo, setEditingTodo] = useState<TodoItem | undefined>();

  const queryClient = useQueryClient();

  // searchTodos('', 필터) → 전체 목록 조회
  const {
    data: todos = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['todos', 'list', filterStatus, filterPriority],
    queryFn: () =>
      searchTodos('', {
        is_completed:
          filterStatus === 'all'
            ? undefined
            : filterStatus === 'completed',
        priority: filterPriority || undefined,
      }),
  });

  const completeMutation = useMutation({
    mutationFn: completeTodo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] });
    },
  });

  const handleAddNew = () => {
    setEditingTodo(undefined);
    setIsModalOpen(true);
  };

  const handleEdit = (todo: unknown) => {
    // TodoDashboardItem → TodoItem 캐스팅 (필드 구조 호환)
    setEditingTodo(todo as TodoItem);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingTodo(undefined);
    queryClient.invalidateQueries({ queryKey: ['todos'] });
  };

  const pendingCount = todos.filter((t) => !t.is_completed).length;
  const completedCount = todos.filter((t) => t.is_completed).length;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* ── Header ── */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">할일 목록</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            미완료{' '}
            <span className="font-medium text-blue-600">{pendingCount}</span>개 ·
            완료{' '}
            <span className="font-medium text-green-600">{completedCount}</span>개
          </p>
        </div>
        <button
          onClick={handleAddNew}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors shadow-sm"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          할일 추가
        </button>
      </div>

      {/* ── Filters ── */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        {/* 상태 필터 */}
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {(
            [
              { value: 'all', label: '전체' },
              { value: 'pending', label: '미완료' },
              { value: 'completed', label: '완료' },
            ] as { value: FilterStatus; label: string }[]
          ).map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setFilterStatus(value)}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                filterStatus === value
                  ? 'bg-white text-blue-600 font-medium shadow-sm'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* 우선순위 필터 */}
        <select
          value={filterPriority}
          onChange={(e) => setFilterPriority(e.target.value as FilterPriority)}
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">우선순위 전체</option>
          <option value="high">🔴 높음</option>
          <option value="medium">🟡 중간</option>
          <option value="low">🟢 낮음</option>
        </select>
      </div>

      {/* ── Content ── */}
      {isLoading ? (
        <div className="flex flex-col items-center py-16 text-gray-400">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-3" />
          <span className="text-sm">불러오는 중...</span>
        </div>
      ) : error ? (
        <div className="text-center py-16">
          <p className="text-red-500 text-sm">데이터를 불러오는 중 오류가 발생했습니다.</p>
          <button
            onClick={() => queryClient.invalidateQueries({ queryKey: ['todos'] })}
            className="mt-2 text-blue-500 text-sm hover:underline"
          >
            다시 시도
          </button>
        </div>
      ) : todos.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-4xl mb-3">🎉</div>
          <p className="text-gray-400 text-base mb-1">
            {filterStatus === 'completed' ? '완료된 할일이 없습니다.' : '할일이 없습니다.'}
          </p>
          {filterStatus !== 'completed' && (
            <button
              onClick={handleAddNew}
              className="mt-2 text-blue-500 text-sm hover:underline"
            >
              첫 번째 할일을 추가해보세요
            </button>
          )}
        </div>
      ) : (
        <ul className="space-y-2">
          {todos.map((todo) => (
            <li
              key={todo.id}
              className={`flex items-start gap-3 p-4 bg-white rounded-xl border transition-all duration-150 ${
                todo.is_completed
                  ? 'border-gray-100 bg-gray-50/60'
                  : 'border-gray-200 hover:border-blue-200 hover:shadow-sm'
              }`}
            >
              {/* 완료 버튼 */}
              <button
                onClick={() => {
                  if (!todo.is_completed && !completeMutation.isPending) {
                    completeMutation.mutate(todo.id);
                  }
                }}
                disabled={todo.is_completed || completeMutation.isPending}
                className={`mt-0.5 w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
                  todo.is_completed
                    ? 'bg-green-500 border-green-500 cursor-default'
                    : 'border-gray-300 hover:border-blue-500 cursor-pointer'
                }`}
                title={todo.is_completed ? '완료됨' : '완료 처리'}
              >
                {todo.is_completed && (
                  <svg viewBox="0 0 12 12" fill="white" className="w-3 h-3">
                    <path
                      fillRule="evenodd"
                      d="M10.293 1.293a1 1 0 011.414 1.414l-6 6a1 1 0 01-1.414 0l-2.5-2.5a1 1 0 111.414-1.414L5 6.586l5.293-5.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </button>

              {/* 내용 */}
              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm font-medium leading-snug ${
                    todo.is_completed
                      ? 'line-through text-gray-400'
                      : 'text-gray-900'
                  }`}
                >
                  {todo.title}
                </p>

                {/* 메타 정보 */}
                <div className="flex flex-wrap items-center gap-2 mt-1.5">
                  {todo.category_name && (
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                      {todo.category_name}
                    </span>
                  )}
                  {todo.due_date && (
                    <span
                      className={`text-xs ${
                        !todo.is_completed &&
                        todo.due_date < new Date().toISOString().split('T')[0]
                          ? 'text-red-400 font-medium'
                          : 'text-gray-400'
                      }`}
                    >
                      📅 {todo.due_date}
                    </span>
                  )}
                  {todo.recurrence_type && (
                    <span className="text-xs text-blue-400">
                      🔁 {RECURRENCE_LABEL[todo.recurrence_type] ?? todo.recurrence_type}
                    </span>
                  )}
                </div>
              </div>

              {/* 우선순위 배지 */}
              {todo.priority && (
                <span
                  className={`flex-shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${
                    PRIORITY_COLOR[todo.priority] ?? ''
                  }`}
                >
                  {PRIORITY_LABEL[todo.priority]}
                </span>
              )}

              {/* 수정 버튼 */}
              {!todo.is_completed && (
                <button
                  onClick={() => handleEdit(todo)}
                  className="flex-shrink-0 text-gray-300 hover:text-blue-500 transition-colors mt-0.5"
                  title="수정"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-4 h-4"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                  </svg>
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {/* ── Modal ── */}
      <TodoModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        initialData={editingTodo}
      />
    </div>
  );
}
