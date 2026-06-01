import type { TodoDashboardItem } from '@/types/dashboard';
import type { RecurrenceAction } from '@/lib/api';
import { DashboardSection } from './DashboardSection';

interface WeekSectionProps {
  items: TodoDashboardItem[];
  onComplete?: (id: string) => void;
  completingId?: string | null;
  onRecurrenceAction?: (id: string, action: RecurrenceAction) => void;
  recurrenceLoadingId?: string | null;
}

export function WeekSection({
  items,
  onComplete,
  completingId,
  onRecurrenceAction,
  recurrenceLoadingId,
}: WeekSectionProps) {
  return (
    <DashboardSection
      title="이번 주 마감"
      items={items}
      onComplete={onComplete}
      completingId={completingId}
      onRecurrenceAction={onRecurrenceAction}
      recurrenceLoadingId={recurrenceLoadingId}
    />
  );
}
