import { useDroppable } from '@dnd-kit/core';
import { formatDate } from '@/lib/calendarUtils';
import { DraggableTodoItem } from './DraggableTodoItem';
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
  const { setNodeRef, isOver } = useDroppable({ id: dateStr });

  const visible = todos.slice(0, MAX_VISIBLE);
  const overflow = todos.length - MAX_VISIBLE;

  return (
    <div
      ref={setNodeRef}
      onClick={() => onClick(dateStr)}
      className={[
        'min-h-20 p-1 cursor-pointer border rounded text-sm transition-colors',
        isCurrentMonth ? 'bg-white' : 'bg-gray-50 text-gray-400',
        isToday ? 'border-blue-500' : 'border-gray-200',
        isSelected ? 'ring-2 ring-blue-400' : '',
        isOver ? 'bg-blue-50 border-blue-400' : '',
      ].join(' ')}
    >
      <span className={['font-semibold text-xs', isToday ? 'text-blue-600' : ''].join(' ')}>
        {date.getDate()}
      </span>
      <ul className="mt-1 space-y-0.5">
        {visible.map((todo) => (
          <DraggableTodoItem key={todo.id} todo={todo} />
        ))}
        {overflow > 0 && (
          <li className="text-xs text-gray-500">+{overflow}개 더</li>
        )}
      </ul>
    </div>
  );
}
