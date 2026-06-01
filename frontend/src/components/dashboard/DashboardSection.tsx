import { useState } from 'react';
import type { TodoDashboardItem } from '@/types/dashboard';
import type { RecurrenceAction } from '@/lib/api';

interface DashboardSectionProps {
  title: string;
  items: TodoDashboardItem[];
  emptyMessage?: string;
  titleClassName?: string;
  itemBorderClassName?: string;
  showCategoryName?: boolean;
  onComplete?: (id: string) => void;
  completingId?: string | null;
  onRecurrenceAction?: (id: string, action: RecurrenceAction) => void;
  recurrenceLoadingId?: string | null;
}

export function DashboardSection({
  title,
  items,
  emptyMessage,
  titleClassName,
  itemBorderClassName = 'border-gray-100',
  showCategoryName = false,
  onComplete,
  completingId,
  onRecurrenceAction,
  recurrenceLoadingId,
}: DashboardSectionProps) {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  return (
    <>
      <h2 className={['text-lg font-semibold mb-2', titleClassName].filter(Boolean).join(' ')}>
        {title}
      </h2>
      {items.length === 0 ? (
        emptyMessage ? <p className="text-gray-400 text-sm">{emptyMessage}</p> : null
      ) : (
        <ul>
          {items.map((item) => (
            <li key={item.id} className={`py-1 border-b ${itemBorderClassName} flex items-center gap-2`}>
              <input
                type="checkbox"
                checked={completingId === item.id}
                disabled={!!completingId}
                onChange={() => onComplete?.(item.id)}
                aria-label={`${item.title} 완료 처리`}
                className="w-4 h-4 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <span>{item.title}</span>
              {showCategoryName && item.category_name && (
                <span className="text-sm text-gray-500 ml-2">{item.category_name}</span>
              )}
              {item.recurrence_type && (
                <div className="relative ml-auto">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenMenuId((id) => (id === item.id ? null : item.id));
                    }}
                    disabled={recurrenceLoadingId === item.id}
                    aria-label="반복 옵션"
                    className="px-2 py-1 text-gray-400 hover:text-gray-600 disabled:opacity-50 text-lg leading-none"
                  >
                    ⋯
                  </button>
                  {openMenuId === item.id && (
                    <div className="absolute right-0 top-full z-10 bg-white border border-gray-200 rounded shadow-md min-w-32">
                      <button
                        onClick={() => {
                          onRecurrenceAction?.(item.id, 'skip');
                          setOpenMenuId(null);
                        }}
                        className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
                      >
                        이번만 건너뛰기
                      </button>
                      {item.recurrence_paused ? (
                        <button
                          onClick={() => {
                            onRecurrenceAction?.(item.id, 'resume');
                            setOpenMenuId(null);
                          }}
                          className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
                        >
                          재개
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            onRecurrenceAction?.(item.id, 'pause');
                            setOpenMenuId(null);
                          }}
                          className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
                        >
                          일시 중지
                        </button>
                      )}
                      <button
                        onClick={() => {
                          onRecurrenceAction?.(item.id, 'end');
                          setOpenMenuId(null);
                        }}
                        className="block w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-gray-50"
                      >
                        반복 종료
                      </button>
                    </div>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
