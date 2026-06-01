import type { TodoCalendarItem } from '@/types/calendar';

const PRIORITY_LABEL: Record<string, string> = {
  high: '높음',
  medium: '보통',
  low: '낮음',
};

interface Props {
  dateStr: string;
  todos: TodoCalendarItem[];
  onClose: () => void;
}

export function DayDetailPanel({ dateStr, todos, onClose }: Props) {
  return (
    <aside className="border-l pl-4">
      <div className="flex justify-between items-center mb-3">
        <h2 className="font-semibold text-sm">{dateStr} 할일</h2>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 text-sm"
        >
          닫기
        </button>
      </div>
      {todos.length === 0 ? (
        <p className="text-gray-500 text-sm">이 날의 할일이 없습니다.</p>
      ) : (
        <ul className="space-y-2">
          {todos.map((todo) => (
            <li key={todo.id} className="border rounded p-2 text-sm">
              <p
                className={[
                  'font-medium',
                  todo.is_completed ? 'line-through text-gray-400' : '',
                ].join(' ')}
              >
                {todo.title}
              </p>
              <div className="flex gap-2 mt-1 text-xs text-gray-500">
                {todo.priority && (
                  <span>{PRIORITY_LABEL[todo.priority] ?? todo.priority}</span>
                )}
                {todo.category_name && <span>{todo.category_name}</span>}
                {todo.is_completed && <span className="text-green-600">완료</span>}
              </div>
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
}
