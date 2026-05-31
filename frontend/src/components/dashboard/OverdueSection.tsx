import type { TodoDashboardItem } from '@/types/dashboard';

interface OverdueSectionProps {
  items: TodoDashboardItem[];
}

export function OverdueSection({ items }: OverdueSectionProps) {
  if (items.length === 0) return null;

  return (
    <>
      <h2 className="text-lg font-semibold text-red-600 mb-2">기한 초과</h2>
      <ul>
        {items.map((item) => (
          <li key={item.id} className="py-1 border-b border-red-100">
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
