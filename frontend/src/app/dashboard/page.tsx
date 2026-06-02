'use client';

import { useDashboard } from '@/hooks/useDashboard';
import { useCompleteTodo } from '@/hooks/useCompleteTodo';
import { useRecurrenceControl } from '@/hooks/useRecurrenceControl';
import { OverdueSection } from '@/components/dashboard/OverdueSection';
import { TodaySection } from '@/components/dashboard/TodaySection';
import { TomorrowSection } from '@/components/dashboard/TomorrowSection';
import { WeekSection } from '@/components/dashboard/WeekSection';

export default function DashboardPage() {
  const { data, isLoading, isError } = useDashboard();
  const { mutate: completeTodo, isPending, variables } = useCompleteTodo();
  const recurrenceControl = useRecurrenceControl();

  const overdue = data?.overdue ?? [];
  const today = data?.today ?? [];
  const tomorrow = data?.tomorrow ?? [];
  const thisWeek = data?.this_week ?? [];

  const completingId = isPending ? (variables ?? null) : null;
  const recurrenceLoadingId = recurrenceControl.isPending
    ? (recurrenceControl.variables?.id ?? null)
    : null;

  return (
    <div className="min-h-screen bg-slate-50/50">
      <div className="max-w-2xl mx-auto px-6 py-10">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-[22px] font-semibold text-slate-900 tracking-tight">대시보드</h1>
          <p className="text-[13px] text-slate-400 mt-1">오늘의 할일을 확인하세요</p>
        </div>

        {isLoading && (
          <div className="flex flex-col items-center py-20">
            <div className="w-5 h-5 border-2 border-slate-300 border-t-slate-700 rounded-full animate-spin mb-3" />
            <p className="text-[13px] text-slate-400">불러오는 중</p>
          </div>
        )}

        {isError && (
          <div className="bg-rose-50 border border-rose-100 rounded-2xl px-4 py-3 mb-6">
            <p className="text-[13px] text-rose-600">데이터를 불러오는 중 오류가 발생했습니다.</p>
          </div>
        )}

        {!isLoading && (
          <div className="space-y-6">
            {overdue.length > 0 && (
              <section data-testid="section-overdue">
                <OverdueSection
                  items={overdue}
                  onComplete={completeTodo}
                  completingId={completingId}
                  onRecurrenceAction={(id, action) => recurrenceControl.mutate({ id, action })}
                  recurrenceLoadingId={recurrenceLoadingId}
                />
              </section>
            )}
            <section data-testid="section-today">
              <TodaySection
                items={today}
                onComplete={completeTodo}
                completingId={completingId}
                onRecurrenceAction={(id, action) => recurrenceControl.mutate({ id, action })}
                recurrenceLoadingId={recurrenceLoadingId}
              />
            </section>
            <section data-testid="section-tomorrow">
              <TomorrowSection
                items={tomorrow}
                onComplete={completeTodo}
                completingId={completingId}
                onRecurrenceAction={(id, action) => recurrenceControl.mutate({ id, action })}
                recurrenceLoadingId={recurrenceLoadingId}
              />
            </section>
            <section data-testid="section-this_week">
              <WeekSection
                items={thisWeek}
                onComplete={completeTodo}
                completingId={completingId}
                onRecurrenceAction={(id, action) => recurrenceControl.mutate({ id, action })}
                recurrenceLoadingId={recurrenceLoadingId}
              />
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
