'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { searchTodos, completeTodo } from '@/lib/api';
import { useDeleteTodo } from '@/hooks/useDeleteTodo';
import TodoModal from '@/components/todos/TodoModal';
import type { TodoItem } from '@/types/todos';

type FilterStatus = 'all' | 'pending' | 'completed';
type FilterPriority = '' | 'high' | 'medium' | 'low';

const PRIORITY_LABEL: Record<string, string> = { high: '높음', medium: '중간', low: '낮음' };

const PRIORITY_STYLE: Record<string, string> = {
  high: 'text-rose-600 bg-rose-50',
  medium: 'text-amber-600 bg-amber-50',
  low: 'text-emerald-600 bg-emerald-50',
};

const RECURRENCE_LABEL: Record<string, string> = { daily: '매일', weekly: '매주', monthly: '매월' };

export default function TodosPage() {
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [filterPriority, setFilterPriority] = useState<FilterPriority>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTodo, setEditingTodo] = useState<TodoItem | undefined>();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const queryClient = useQueryClient();
  const deleteMutation = useDeleteTodo();

  const { data: todos = [], isLoading, error } = useQuery({
    queryKey: ['todos', 'list', filterStatus, filterPriority],
    queryFn: () =>
      searchTodos('', {
        is_completed: filterStatus === 'all' ? undefined : filterStatus === 'completed',
        priority: filterPriority || undefined,
      }),
  });

  const completeMutation = useMutation({
    mutationFn: completeTodo,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['todos'] }),
  });

  const handleAddNew = () => { setEditingTodo(undefined); setIsModalOpen(true); };
  const handleEdit = (todo: unknown) => { setEditingTodo(todo as TodoItem); setIsModalOpen(true); };
  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingTodo(undefined);
    queryClient.invalidateQueries({ queryKey: ['todos'] });
  };
  const handleDelete = (id: string) => {
    if (!confirm('정말 삭제할까요?')) return;
    setDeletingId(id);
    deleteMutation.mutate(id, { onSettled: () => setDeletingId(null) });
  };

  const pendingCount = todos.filter((t) => !t.is_completed).length;
  const completedCount = todos.filter((t) => t.is_completed).length;

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="min-h-screen bg-slate-50/50">
      <div className="max-w-2xl mx-auto px-6 py-10">

        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-[22px] font-semibold text-slate-900 tracking-tight">할일</h1>
            <p className="text-[13px] text-slate-400 mt-1">
              미완료 <span className="text-slate-700 font-medium">{pendingCount}</span>개 ·{' '}
              완료 <span className="text-slate-700 font-medium">{completedCount}</span>개
            </p>
          </div>
          <button
            onClick={handleAddNew}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white text-[13px] font-medium rounded-xl hover:bg-slate-800 active:scale-[0.98] transition-all duration-150"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            새 할일
          </button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2.5 mb-6">
          <div className="flex gap-0.5 bg-white border border-slate-200 rounded-xl p-1">
            {([
              { value: 'all', label: '전체' },
              { value: 'pending', label: '미완료' },
              { value: 'completed', label: '완료' },
            ] as { value: FilterStatus; label: string }[]).map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setFilterStatus(value)}
                className={`px-3.5 py-1.5 text-[12.5px] rounded-lg font-medium transition-all duration-150 ${
                  filterStatus === value
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-700'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value as FilterPriority)}
            className="bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-[12.5px] text-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all"
          >
            <option value="">우선순위 전체</option>
            <option value="high">높음</option>
            <option value="medium">중간</option>
            <option value="low">낮음</option>
          </select>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex flex-col items-center py-20">
            <div className="w-5 h-5 border-2 border-slate-300 border-t-slate-700 rounded-full animate-spin mb-3" />
            <p className="text-[13px] text-slate-400">불러오는 중</p>
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <p className="text-[13px] text-slate-400">오류가 발생했습니다</p>
            <button onClick={() => queryClient.invalidateQueries({ queryKey: ['todos'] })} className="mt-2 text-[13px] text-slate-600 underline underline-offset-2">다시 시도</button>
          </div>
        ) : todos.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
              </svg>
            </div>
            <p className="text-[14px] font-medium text-slate-700 mb-1">
              {filterStatus === 'completed' ? '완료된 할일이 없어요' : '할일이 없어요'}
            </p>
            {filterStatus !== 'completed' && (
              <button onClick={handleAddNew} className="text-[13px] text-slate-400 hover:text-slate-700 transition-colors underline underline-offset-2">첫 번째 할일 추가하기</button>
            )}
          </div>
        ) : (
          <ul className="space-y-1.5">
            {todos.map((todo) => {
              const isOverdue = !todo.is_completed && todo.due_date && todo.due_date < today;
              return (
                <li
                  key={todo.id}
                  className={`group flex items-start gap-3.5 px-4 py-3.5 bg-white rounded-2xl border transition-all duration-150 ${
                    todo.is_completed
                      ? 'border-slate-100 opacity-55'
                      : 'border-slate-200/80 hover:border-slate-300 hover:shadow-sm'
                  }`}
                >
                  {/* 완료 버튼 */}
                  <button
                    onClick={() => { if (!todo.is_completed && !completeMutation.isPending) completeMutation.mutate(todo.id); }}
                    disabled={todo.is_completed || completeMutation.isPending}
                    className={`mt-0.5 w-[18px] h-[18px] rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all ${
                      todo.is_completed
                        ? 'bg-emerald-500 border-emerald-500 cursor-default'
                        : 'border-slate-300 hover:border-slate-500 cursor-pointer'
                    }`}
                  >
                    {todo.is_completed && (
                      <svg viewBox="0 0 10 10" fill="none" className="w-2.5 h-2.5">
                        <path d="M1.5 5l2.5 2.5 4.5-4.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </button>

                  {/* 내용 */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-[14px] font-medium leading-snug ${todo.is_completed ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                      {todo.title}
                    </p>
                    <div className="flex flex-wrap items-center gap-2.5 mt-1.5">
                      {todo.due_date && (
                        <span className={`text-[12px] flex items-center gap-1 ${isOverdue ? 'text-rose-500 font-medium' : 'text-slate-400'}`}>
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                          </svg>
                          {todo.due_date}
                        </span>
                      )}
                      {todo.recurrence_type && (
                        <span className="text-[12px] text-indigo-400 flex items-center gap-1">
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 014-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 01-4 4H3"/>
                          </svg>
                          {RECURRENCE_LABEL[todo.recurrence_type]}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 우선순위 배지 */}
                  {todo.priority && (
                    <span className={`flex-shrink-0 text-[11.5px] px-2 py-0.5 rounded-full font-medium mt-0.5 ${PRIORITY_STYLE[todo.priority] ?? ''}`}>
                      {PRIORITY_LABEL[todo.priority]}
                    </span>
                  )}

                  {/* 액션 버튼들 */}
                  <div className="flex-shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity mt-0.5">
                    {!todo.is_completed && (
                      <button onClick={() => handleEdit(todo)} className="p-1 text-slate-300 hover:text-slate-600 transition-colors rounded-lg hover:bg-slate-50" title="수정">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(todo.id)}
                      disabled={deletingId === todo.id}
                      className="p-1 text-slate-300 hover:text-rose-500 transition-colors rounded-lg hover:bg-rose-50 disabled:opacity-40"
                      title="삭제"
                    >
                      {deletingId === todo.id ? (
                        <div className="w-3.5 h-3.5 border border-rose-400 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
                        </svg>
                      )}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <TodoModal isOpen={isModalOpen} onClose={handleModalClose} initialData={editingTodo} />
    </div>
  );
}
