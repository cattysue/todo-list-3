import type { TodoDashboardItem } from '@/types/dashboard';
import { DashboardSection } from './DashboardSection';

interface TomorrowSectionProps {
  items: TodoDashboardItem[];
  onComplete?: (id: string) => void;
  completingId?: string | null;
}

export function TomorrowSection({ items, onComplete, completingId }: TomorrowSectionProps) {
  return (
    <DashboardSection
      title="내일 마감"
      items={items}
      onComplete={onComplete}
      completingId={completingId}
    />
  );
}
