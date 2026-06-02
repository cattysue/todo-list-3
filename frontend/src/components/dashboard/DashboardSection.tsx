'use client';

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
  showCategoryName = false,
  onComplete,
  completingId,
  onRecurrenceAction,
  recurrenceLoadingId,
}: DashboardSectionProps) {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  return (
    <div>
      <h2 className={['text-[11px] font-semibold uppercase tracking-widest text-slate-400 mb-3', titleClassName].filter(Boolean).join(' ')}>
        {title}
      </h2>

      {items.length === 0 ? (
        emptyMessage ? (
          <p className="text-[13px] text-slate-300 py-2">{emptyMessage}</p>
        ) : null
      ) : (
        <ul className="space-y-1.5">
          {items.map((item) => (
            <li
              key={item.id}
              className="group flex items-center gap-3 px-4 py-3 bg-white rounded-2xl border border-slate-200/80 hover:border-slate-300 hover:shadow-sm transition-all duration-150"
            >
              {/* 완료 버튼 */}
              <button
                onClick={() => onComplete?.(item.id)}
                disabled={!!completingId}
                aria-label={`${item.title} 완료 처리`}
                className={`w-[18px] h-[18px] rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all ${
                  completingId === item.id
                    ? 'bg-emerald-500 border-emerald-500'
                    : 'border-slate-300 hover:border-slate-500 cursor-pointer disabled:opacity-40'
                }`}
              >
                {completingId === item.id && (
                  <svg viewBox="0 0 10 10" fill="none" className="w-2.5 h-2.5">
                    <path d="M1.5 5l2.5 2.5 4.5-4.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </button>

              {/* 제목 */}
              <span className="flex-1 text-[14px] text-slate-800 font-medium truncate">
                {item.title}
              </span>

              {/* 카테고리 */}
              {showCategoryName && item.category_name && (
                <span className="text-[12px] text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full">
                  {item.category_name}
                </span>
              )}

              {/* 반복 메뉴 */}
              {item.recurrence_type && (
                <div className="relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenMenuId((id) => (id === item.id ? null : item.id));
                    }}
                    disabled={recurrenceLoadingId === item.id}
                    aria-label="반복 옵션"
                    className="flex items-center justify-center w-7 h-7 text-slate-300 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-all disabled:opacity-40"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 014-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 01-4 4H3"/>
                    </svg>
                  </button>

                  {openMenuId === item.id && (
                    <div className="absolute right-0 top-full mt-1 z-20 bg-white border border-slate-200 rounded-xl shadow-lg min-w-36 py-1 overflow-hidden">
                      {!item.recurrence_paused && (
                        <button
                          onClick={() => { onRecurrenceAction?.(item.id, 'skip'); setOpenMenuId(null); }}
                          className="block w-full text-left px-3.5 py-2 text-[13px] text-slate-700 hover:bg-slate-50 transition-colors"
                        >
                          이번만 건너뛰기
                        </button>
                      )}
                      {item.recurrence_paused ? (
                        <button
                          onClick={() => { onRecurrenceAction?.(item.id, 'resume'); setOpenMenuId(null); }}
                          className="block w-full text-left px-3.5 py-2 text-[13px] text-slate-700 hover:bg-slate-50 transition-colors"
                        >
                          재개
                        </button>
                      ) : (
                        <button
                          onClick={() => { onRecurrenceAction?.(item.id, 'pause'); setOpenMenuId(null); }}
                          className="block w-full text-left px-3.5 py-2 text-[13px] text-slate-700 hover:bg-slate-50 transition-colors"
                        >
                          일시 중지
                        </button>
                      )}
                      <div className="border-t border-slate-100 my-1" />
                      <button
                        onClick={() => { onRecurrenceAction?.(item.id, 'end'); setOpenMenuId(null); }}
                        className="block w-full text-left px-3.5 py-2 text-[13px] text-rose-500 hover:bg-rose-50 transition-colors"
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
    </div>
  );
}
