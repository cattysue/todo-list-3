'use client';

import { useMemo, useState } from 'react';
import { useCalendar } from '@/hooks/useCalendar';
import { MonthView } from '@/components/calendar/MonthView';
import { WeekView } from '@/components/calendar/WeekView';
import { DayDetailPanel } from '@/components/calendar/DayDetailPanel';
import {
  getMonthRange,
  getWeekRange,
  navigateMonth,
  navigateWeek,
} from '@/lib/calendarUtils';
import type { CalendarView, TodoCalendarItem } from '@/types/calendar';
import CalendarLoading from './loading';

export default function CalendarPage() {
  const [view, setView] = useState<CalendarView>('month');
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const range = useMemo(
    () => (view === 'month' ? getMonthRange(currentDate) : getWeekRange(currentDate)),
    [view, currentDate],
  );

  const { data: todos = [], isLoading, isError } = useCalendar(range.start, range.end);

  const todosByDate = useMemo(() => {
    const map: Record<string, TodoCalendarItem[]> = {};
    for (const todo of todos) {
      const key = todo.due_date.slice(0, 10);
      if (!map[key]) map[key] = [];
      map[key].push(todo);
    }
    return map;
  }, [todos]);

  const selectedTodos = selectedDate ? (todosByDate[selectedDate] ?? []) : [];

  function handleNavigate(direction: 1 | -1) {
    setCurrentDate((prev) =>
      view === 'month' ? navigateMonth(prev, direction) : navigateWeek(prev, direction),
    );
    setSelectedDate(null);
  }

  function handleViewChange(newView: CalendarView) {
    setView(newView);
    setSelectedDate(null);
  }

  const label =
    view === 'month'
      ? currentDate.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' })
      : `${range.start} ~ ${range.end}`;

  if (isLoading) return <CalendarLoading />;

  return (
    <main className="max-w-5xl mx-auto p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-2">
          <button
            onClick={() => handleViewChange('month')}
            className={[
              'px-4 py-1.5 rounded text-sm font-medium',
              view === 'month' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700',
            ].join(' ')}
          >
            월간
          </button>
          <button
            onClick={() => handleViewChange('week')}
            className={[
              'px-4 py-1.5 rounded text-sm font-medium',
              view === 'week' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700',
            ].join(' ')}
          >
            주간
          </button>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleNavigate(-1)}
            className="px-2 py-1 text-gray-600 hover:bg-gray-100 rounded"
          >
            &lt;
          </button>
          <span className="text-sm font-semibold w-52 text-center">
            {label}
          </span>
          <button
            onClick={() => handleNavigate(1)}
            className="px-2 py-1 text-gray-600 hover:bg-gray-100 rounded"
          >
            &gt;
          </button>
        </div>
      </div>

      {isError && (
        <p role="alert" className="text-red-600 mb-4 text-sm">
          캘린더 데이터를 불러오는 중 오류가 발생했습니다.
        </p>
      )}

      <div className={['flex gap-4', selectedDate ? 'items-start' : ''].join(' ')}>
        <div className={selectedDate ? 'flex-1' : 'w-full'}>
          {view === 'month' ? (
            <MonthView
              currentDate={currentDate}
              todosByDate={todosByDate}
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
            />
          ) : (
            <WeekView
              currentDate={currentDate}
              todosByDate={todosByDate}
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
            />
          )}
        </div>
        {selectedDate && (
          <div className="w-64 shrink-0">
            <DayDetailPanel
              dateStr={selectedDate}
              todos={selectedTodos}
              onClose={() => setSelectedDate(null)}
            />
          </div>
        )}
      </div>
    </main>
  );
}
