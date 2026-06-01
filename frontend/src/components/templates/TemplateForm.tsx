'use client';

import { useState } from 'react';

import { useCategories } from '@/hooks/useCategories';
import type { CreateTemplateRequest } from '@/types/templates';

interface ItemDraft {
  title: string;
  priority: 'high' | 'medium' | 'low' | null;
  category_id: string | null;
  due_date_offset: number | null;
}

interface Props {
  onSubmit: (data: CreateTemplateRequest) => void;
  isSubmitting: boolean;
}

const EMPTY_ITEM: ItemDraft = {
  title: '',
  priority: null,
  category_id: null,
  due_date_offset: null,
};

export function TemplateForm({ onSubmit, isSubmitting }: Props) {
  const [name, setName] = useState('');
  const [items, setItems] = useState<ItemDraft[]>([{ ...EMPTY_ITEM }]);
  const { data: categories = [] } = useCategories();

  function addItem() {
    setItems((prev) => [...prev, { ...EMPTY_ITEM }]);
  }

  function removeItem(idx: number) {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  }

  function updateItem<K extends keyof ItemDraft>(idx: number, key: K, value: ItemDraft[K]) {
    setItems((prev) => prev.map((item, i) => (i === idx ? { ...item, [key]: value } : item)));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    const validItems = items.filter((item) => item.title.trim());
    onSubmit({
      name: name.trim(),
      items: validItems.map((item) => ({
        title: item.title.trim(),
        priority: item.priority,
        category_id: item.category_id,
        due_date_offset: item.due_date_offset,
      })),
    });
    setName('');
    setItems([{ ...EMPTY_ITEM }]);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">템플릿 이름</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="예: 아침 루틴"
          required
          className="w-full border rounded px-3 py-2 text-sm"
        />
      </div>

      <div className="space-y-3">
        <p className="text-sm font-medium">할일 항목</p>
        {items.map((item, idx) => (
          <div key={idx} className="border rounded p-3 space-y-2 bg-gray-50">
            <div className="flex gap-2">
              <input
                type="text"
                value={item.title}
                onChange={(e) => updateItem(idx, 'title', e.target.value)}
                placeholder="할일 제목"
                className="flex-1 border rounded px-2 py-1 text-sm"
              />
              {items.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeItem(idx)}
                  className="text-red-500 text-sm px-2"
                >
                  삭제
                </button>
              )}
            </div>
            <div className="flex gap-2">
              <select
                value={item.priority ?? ''}
                onChange={(e) =>
                  updateItem(idx, 'priority', (e.target.value as ItemDraft['priority']) || null)
                }
                className="border rounded px-2 py-1 text-sm"
              >
                <option value="">우선순위 없음</option>
                <option value="high">높음</option>
                <option value="medium">중간</option>
                <option value="low">낮음</option>
              </select>
              <select
                value={item.category_id ?? ''}
                onChange={(e) => updateItem(idx, 'category_id', e.target.value || null)}
                className="border rounded px-2 py-1 text-sm"
              >
                <option value="">카테고리 없음</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
              <input
                type="number"
                value={item.due_date_offset ?? ''}
                onChange={(e) =>
                  updateItem(
                    idx,
                    'due_date_offset',
                    e.target.value === '' ? null : parseInt(e.target.value, 10),
                  )
                }
                placeholder="마감 오프셋(일)"
                min={0}
                className="w-28 border rounded px-2 py-1 text-sm"
              />
            </div>
          </div>
        ))}
        <button
          type="button"
          onClick={addItem}
          className="text-sm text-blue-600 hover:underline"
        >
          + 항목 추가
        </button>
      </div>

      <button
        type="submit"
        disabled={isSubmitting || !name.trim()}
        className="px-4 py-2 bg-blue-600 text-white text-sm rounded disabled:opacity-50"
      >
        {isSubmitting ? '저장 중...' : '템플릿 저장'}
      </button>
    </form>
  );
}
