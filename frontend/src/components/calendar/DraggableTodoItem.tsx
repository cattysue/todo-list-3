import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import type { TodoCalendarItem } from '@/types/calendar';

interface Props {
  todo: TodoCalendarItem;
}

export function DraggableTodoItem({ todo }: Props) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: todo.id,
  });

  const style: React.CSSProperties | undefined = transform
    ? {
        transform: CSS.Translate.toString(transform),
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 50 : undefined,
      }
    : undefined;

  return (
    <li
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={(e) => e.stopPropagation()}
      className={[
        'truncate text-xs px-1 rounded cursor-grab active:cursor-grabbing',
        todo.is_completed
          ? 'line-through text-gray-400 bg-gray-100'
          : 'bg-blue-100 text-blue-800',
      ].join(' ')}
    >
      {todo.title}
    </li>
  );
}
