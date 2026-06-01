'use client';

import { useState } from 'react';

import { useCreateTodo } from '@/hooks/useCreateTodo';
import { useUpdateTodo } from '@/hooks/useUpdateTodo';
import { useCategories } from '@/hooks/useCategories';
import type { TodoItem, RecurrenceType } from '@/types/todos';

const DAY_LABELS = ['월', '화', '수', '목', '금', '토', '일'];

interface Props {
  initialData?: TodoItem;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function TodoForm({ initialData, onSuccess, onCancel }: Props) {
  const isEdit = !!initialData;

  const [title, setTitle] = useState(initialData?.title ?? '');
  const [categoryId, setCategoryId] = useState(initialData?.category_id ?? '');
  const [priority, setPriority] = useState<'high' | 'medium' | 'low' | ''>(
    initialData?.priority ?? '',
  );
  const [dueDate, setDueDate] = useState(initialData?.due_date ?? '');
  const [recurrenceType, setRecurrenceType] = useState<RecurrenceType | ''>(
    initialData?.recurrence_type ?? '',
  );
  const [selectedDays, setSelectedDays] = useState<number[]>(() => {
    if (initialData?.recurrence_days) {
      return initialData.recurrence_days.split(',').map(Number).filter(Number.isFinite);
    }
    return [];
  });
  const [dayOfMonth, setDayOfMonth] = useState<string>(
    initialData?.recurrence_day_of_month?.toString() ?? '',
  );
  const [error, setError] = useState('');

  const { data: categories = [] } = useCategories();
  const createMutation = useCreateTodo();
  const updateMutation = useUpdateTodo();

  const isPending = createMutation.isPending || updateMutation.isPending;

  const toggleDay = (day: number) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('제목을 입력해 주세요.');
      return;
    }

    if (recurrenceType === 'weekly' && selectedDays.length === 0) {
      setError('매주 반복 시 요일을 최소 1개 선택해 주세요.');
      return;
    }

    const dayOfMonthNum = dayOfMonth ? parseInt(dayOfMonth, 10) : undefined;
    if (recurrenceType === 'monthly') {
      if (!dayOfMonthNum || dayOfMonthNum < 1 || dayOfMonthNum > 31) {
        setError('매월 반복 시 1~31 사이의 날짜를 입력해 주세요.');
        return;
      }
    }

    // edit 모드: recurrence 필드를 항상 명시적으로 전송해 DB 값을 정확히 덮어씀
    // create 모드: 값이 없으면 undefined로 생략 (DB 기본값 NULL 사용)
    const recurrencePayload = isEdit
      ? {
          recurrence_type: (recurrenceType || null) as RecurrenceType | null,
          recurrence_days:
            recurrenceType === 'weekly' && selectedDays.length > 0
              ? [...selectedDays].sort((a, b) => a - b).join(',')
              : null,
          recurrence_day_of_month:
            recurrenceType === 'monthly' ? (dayOfMonthNum ?? null) : null,
        }
      : {
          recurrence_type: (recurrenceType || undefined) as RecurrenceType | undefined,
          recurrence_days:
            recurrenceType === 'weekly' && selectedDays.length > 0
              ? [...selectedDays].sort((a, b) => a - b).join(',')
              : undefined,
          recurrence_day_of_month:
            recurrenceType === 'monthly' ? dayOfMonthNum : undefined,
        };

    const payload = {
      title: title.trim(),
      category_id: categoryId || undefined,
      priority: (priority || undefined) as 'high' | 'medium' | 'low' | undefined,
      due_date: dueDate || undefined,
      ...recurrencePayload,
    };

    if (isEdit && initialData) {
      updateMutation.mutate(
        { id: initialData.id, data: payload },
        {
          onSuccess,
          onError: () => setError('할일 수정 중 오류가 발생했습니다. 다시 시도해 주세요.'),
        },
      );
    } else {
      createMutation.mutate(payload, {
        onSuccess,
        onError: () => setError('할일 생성 중 오류가 발생했습니다. 다시 시도해 주세요.'),
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-900">
        {isEdit ? '할일 수정' : '할일 추가'}
      </h2>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded">{error}</p>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          제목 <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="할일 제목을 입력하세요"
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isPending}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">카테고리</label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isPending}
          >
            <option value="">없음</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">우선순위</label>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as 'high' | 'medium' | 'low' | '')}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isPending}
          >
            <option value="">없음</option>
            <option value="high">높음</option>
            <option value="medium">중간</option>
            <option value="low">낮음</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">마감일</label>
        <input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isPending}
        />
      </div>

      <div className="border border-gray-200 rounded-md p-3 space-y-3">
        <label className="block text-sm font-medium text-gray-700">반복 주기</label>

        <div className="flex flex-wrap gap-2">
          {(['', 'daily', 'weekly', 'monthly'] as const).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => {
                setRecurrenceType(type);
                setSelectedDays([]);
                setDayOfMonth('');
              }}
              disabled={isPending}
              className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                recurrenceType === type
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
              }`}
            >
              {type === '' ? '반복 없음' : type === 'daily' ? '매일' : type === 'weekly' ? '매주' : '매월'}
            </button>
          ))}
        </div>

        {recurrenceType === 'weekly' && (
          <div>
            <p className="text-xs text-gray-500 mb-2">요일 선택 (최소 1개)</p>
            <div className="flex gap-1">
              {DAY_LABELS.map((label, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => toggleDay(idx)}
                  disabled={isPending}
                  className={`w-9 h-9 text-sm rounded-full border transition-colors ${
                    selectedDays.includes(idx)
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}

        {recurrenceType === 'monthly' && (
          <div>
            <label className="text-xs text-gray-500 mb-1 block">매월 몇 일?</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={dayOfMonth}
                onChange={(e) => setDayOfMonth(e.target.value)}
                placeholder="1~31"
                className="w-20 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isPending}
              />
              <span className="text-sm text-gray-600">일</span>
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={isPending}
          className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
        >
          취소
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="px-4 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {isPending ? '저장 중...' : '저장'}
        </button>
      </div>
    </form>
  );
}
