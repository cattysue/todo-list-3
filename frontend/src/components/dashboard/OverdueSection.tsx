import type { TodoDashboardItem } from '@/types/dashboard';

interface OverdueSectionProps {
  items: TodoDashboardItem[];
  onComplete?: (id: string) => void;
  completingId?: string | null;
}

export function OverdueSection({ items, onComplete, completingId }: OverdueSectionProps) {
  if (items.length === 0) return null;

  return (
    <>
      <h2 className="text-lg font-semibold text-red-600 mb-2">기한 초과</h2>
      <ul>
        {items.map((item) => (
          <li key={item.id} className="py-1 border-b border-red-100 flex items-center gap-2">
            <input
              type="checkbox"
              checked={completingId === item.id}
              disabled={!!completingId}
              onChange={() => onComplete?.(item.id)}
              aria-label={`${item.title} 완료 처리`}
              className="w-4 h-4 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <span>{item.title}</span>
            {item.category_name && (
              <span className="text-sm text-gray-500 ml-2">{item.category_name}</span>
            )}
          </li>
        ))}
      </ul>
    </>
  );
}
