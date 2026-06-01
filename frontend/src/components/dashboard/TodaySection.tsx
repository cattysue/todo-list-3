import type { TodoDashboardItem } from '@/types/dashboard';
import type { RecurrenceAction } from '@/lib/api';
import { DashboardSection } from './DashboardSection';

interface TodaySectionProps {
  items: TodoDashboardItem[];
  onComplete?: (id: string) => void;
  completingId?: string | null;
  onRecurrenceAction?: (id: string, action: RecurrenceAction) => void;
  recurrenceLoadingId?: string | null;
}

export function TodaySection({
  items,
  onComplete,
  completingId,
  onRecurrenceAction,
  recurrenceLoadingId,
}: TodaySectionProps) {
  return (
    <DashboardSection
      title="오늘 마감"
      items={items}
      emptyMessage="오늘 마감 없음"
      onComplete={onComplete}
      completingId={completingId}
      onRecurrenceAction={onRecurrenceAction}
      recurrenceLoadingId={recurrenceLoadingId}
    />
  );
}
