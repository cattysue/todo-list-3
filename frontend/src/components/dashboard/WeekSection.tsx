import type { TodoDashboardItem } from '@/types/dashboard';
import { DashboardSection } from './DashboardSection';

interface WeekSectionProps {
  items: TodoDashboardItem[];
  onComplete?: (id: string) => void;
  completingId?: string | null;
}

export function WeekSection({ items, onComplete, completingId }: WeekSectionProps) {
  return (
    <DashboardSection
      title="이번 주 마감"
      items={items}
      onComplete={onComplete}
      completingId={completingId}
    />
  );
}
