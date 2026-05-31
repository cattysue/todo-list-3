import type { TodoDashboardItem } from '@/types/dashboard';
import { DashboardSection } from './DashboardSection';

interface OverdueSectionProps {
  items: TodoDashboardItem[];
  onComplete?: (id: string) => void;
  completingId?: string | null;
}

export function OverdueSection({ items, onComplete, completingId }: OverdueSectionProps) {
  if (items.length === 0) return null;

  return (
    <DashboardSection
      title="기한 초과"
      items={items}
      titleClassName="text-red-600"
      itemBorderClassName="border-red-100"
      showCategoryName
      onComplete={onComplete}
      completingId={completingId}
    />
  );
}
