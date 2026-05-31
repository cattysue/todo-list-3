import type { TodoDashboardItem } from '@/types/dashboard';
import { DashboardSection } from './DashboardSection';

interface WeekSectionProps {
  items: TodoDashboardItem[];
}

export function WeekSection({ items }: WeekSectionProps) {
  return <DashboardSection title="이번 주 마감" items={items} />;
}
