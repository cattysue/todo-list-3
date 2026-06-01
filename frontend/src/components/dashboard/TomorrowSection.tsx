import type { TodoDashboardItem } from '@/types/dashboard';
import type { RecurrenceAction } from '@/lib/api';
import { DashboardSection } from './DashboardSection';

interface TomorrowSectionProps {
  items: TodoDashboardItem[];
  onComplete?: (id: string) => void;
  completingId?: string | null;
  onRecurrenceAction?: (id: string, action: RecurrenceAction) => void;
  recurrenceLoadingId?: string | null;
}

export function TomorrowSection({
  items,
  onComplete,
  completingId,
  onRecurrenceAction,
  recurrenceLoadingId,
}: TomorrowSectionProps) {
  return (
    <DashboardSection
      title="내일 마감"
      items={items}
      onComplete={onComplete}
      completingId={completingId}
      onRecurrenceAction={onRecurrenceAction}
      recurrenceLoadingId={recurrenceLoadingId}
    />
  );
}
