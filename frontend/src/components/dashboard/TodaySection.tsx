import type { TodoDashboardItem } from '@/types/dashboard';
import { DashboardSection } from './DashboardSection';

interface TodaySectionProps {
  items: TodoDashboardItem[];
}

export function TodaySection({ items }: TodaySectionProps) {
  return (
    <DashboardSection
      title="오늘 마감"
      items={items}
      emptyMessage="오늘 마감 없음"
    />
  );
}
