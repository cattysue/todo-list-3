'use client';

import { useDashboard } from '@/hooks/useDashboard';
import { useCompleteTodo } from '@/hooks/useCompleteTodo';
import { OverdueSection } from '@/components/dashboard/OverdueSection';
import { TodaySection } from '@/components/dashboard/TodaySection';
import { TomorrowSection } from '@/components/dashboard/TomorrowSection';
import { WeekSection } from '@/components/dashboard/WeekSection';
import DashboardLoading from './loading';

export default function DashboardPage() {
  const { data, isLoading, isError } = useDashboard();
  const { mutate: completeTodo, isPending, variables } = useCompleteTodo();

  if (isLoading) return <DashboardLoading />;

  const overdue = data?.overdue ?? [];
  const today = data?.today ?? [];
  const tomorrow = data?.tomorrow ?? [];
  const thisWeek = data?.this_week ?? [];

  const completingId = isPending ? (variables ?? null) : null;

  return (
    <main className="max-w-2xl mx-auto p-4">
      {isError && (
        <p role="alert" className="text-red-600 mb-4">
          데이터를 불러오는 중 오류가 발생했습니다.
        </p>
      )}
      {overdue.length > 0 && (
        <section data-testid="section-overdue" className="mb-6">
          <OverdueSection
            items={overdue}
            onComplete={completeTodo}
            completingId={completingId}
          />
        </section>
      )}
      <section data-testid="section-today" className="mb-6">
        <TodaySection
          items={today}
          onComplete={completeTodo}
          completingId={completingId}
        />
      </section>
      <section data-testid="section-tomorrow" className="mb-6">
        <TomorrowSection
          items={tomorrow}
          onComplete={completeTodo}
          completingId={completingId}
        />
      </section>
      <section data-testid="section-this_week" className="mb-6">
        <WeekSection
          items={thisWeek}
          onComplete={completeTodo}
          completingId={completingId}
        />
      </section>
    </main>
  );
}
