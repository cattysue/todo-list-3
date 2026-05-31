import type { TodoDashboardItem } from '@/types/dashboard';

interface DashboardSectionProps {
  title: string;
  items: TodoDashboardItem[];
  emptyMessage?: string;
  titleClassName?: string;
}

export function DashboardSection({
  title,
  items,
  emptyMessage,
  titleClassName,
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
            <li key={item.id} className="py-1 border-b border-gray-100">
              {item.title}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
