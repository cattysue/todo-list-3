import { getMonthGridDays, isSameMonth, isToday, formatDate } from '@/lib/calendarUtils';
import { DayCell } from './DayCell';
import type { TodoCalendarItem } from '@/types/calendar';

const WEEKDAYS = ['월', '화', '수', '목', '금', '토', '일'];

interface Props {
  currentDate: Date;
  todosByDate: Record<string, TodoCalendarItem[]>;
  selectedDate: string | null;
  onSelectDate: (dateStr: string) => void;
}

export function MonthView({ currentDate, todosByDate, selectedDate, onSelectDate }: Props) {
  const days = getMonthGridDays(currentDate);

  return (
    <div>
      <div className="grid grid-cols-7 gap-1 mb-1">
        {WEEKDAYS.map((d) => (
          <div key={d} className="text-center text-xs font-semibold text-gray-500 py-1">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => {
          const dateStr = formatDate(day);
          return (
            <DayCell
              key={dateStr}
              date={day}
              todos={todosByDate[dateStr] ?? []}
              isCurrentMonth={isSameMonth(day, currentDate)}
              isToday={isToday(day)}
              isSelected={selectedDate === dateStr}
              onClick={onSelectDate}
            />
          );
        })}
      </div>
    </div>
  );
}
