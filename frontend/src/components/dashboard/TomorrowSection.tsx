import type { TodoDashboardItem } from '@/types/dashboard';
import { DashboardSection } from './DashboardSection';

interface TomorrowSectionProps {
  items: TodoDashboardItem[];
}

export function TomorrowSection({ items }: TomorrowSectionProps) {
  return <DashboardSection title="내일 마감" items={items} />;
}
