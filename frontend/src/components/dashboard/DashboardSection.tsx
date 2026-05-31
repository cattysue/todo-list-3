import type { TodoDashboardItem } from '@/types/dashboard';

interface DashboardSectionProps {
  title: string;
  items: TodoDashboardItem[];
  emptyMessage?: string;
  titleClassName?: string;
  itemBorderClassName?: string;
  showCategoryName?: boolean;
  onComplete?: (id: string) => void;
  completingId?: string | null;
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
}: DashboardSectionProps) {
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
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
