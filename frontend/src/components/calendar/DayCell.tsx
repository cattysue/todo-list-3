import { formatDate } from '@/lib/calendarUtils';
import type { TodoCalendarItem } from '@/types/calendar';

const MAX_VISIBLE = 3;

interface Props {
  date: Date;
  todos: TodoCalendarItem[];
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  onClick: (dateStr: string) => void;
}

export function DayCell({ date, todos, isCurrentMonth, isToday, isSelected, onClick }: Props) {
  const dateStr = formatDate(date);
  const visible = todos.slice(0, MAX_VISIBLE);
  const overflow = todos.length - MAX_VISIBLE;

  return (
    <div
      onClick={() => onClick(dateStr)}
      className={[
        'min-h-20 p-1 cursor-pointer border rounded text-sm',
        isCurrentMonth ? 'bg-white' : 'bg-gray-50 text-gray-400',
        isToday ? 'border-blue-500' : 'border-gray-200',
        isSelected ? 'ring-2 ring-blue-400' : '',
      ].join(' ')}
    >
      <span className={['font-semibold text-xs', isToday ? 'text-blue-600' : ''].join(' ')}>
        {date.getDate()}
      </span>
      <ul className="mt-1 space-y-0.5">
        {visible.map((todo) => (
          <li
            key={todo.id}
            className={[
              'truncate text-xs px-1 rounded',
              todo.is_completed
                ? 'line-through text-gray-400 bg-gray-100'
                : 'bg-blue-100 text-blue-800',
            ].join(' ')}
          >
            {todo.title}
          </li>
        ))}
        {overflow > 0 && (
          <li className="text-xs text-gray-500">+{overflow}개 더</li>
        )}
      </ul>
    </div>
  );
}
