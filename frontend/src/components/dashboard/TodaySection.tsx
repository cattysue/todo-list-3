import type { TodoDashboardItem } from '@/types/dashboard';
import { DashboardSection } from './DashboardSection';

interface TodaySectionProps {
  items: TodoDashboardItem[];
  onComplete?: (id: string) => void;
  completingId?: string | null;
}

export function TodaySection({ items, onComplete, completingId }: TodaySectionProps) {
  return (
    <DashboardSection
      title="오늘 마감"
      items={items}
      emptyMessage="오늘 마감 없음"
      onComplete={onComplete}
      completingId={completingId}
    />
  );
}
