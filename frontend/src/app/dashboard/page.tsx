'use client';

import { useDashboard } from '@/hooks/useDashboard';
import type { TodoDashboardItem } from '@/types/dashboard';
import DashboardLoading from './loading';
import { SECTIONS, type SectionKey } from './sections';

export default function DashboardPage() {
  const { data, isLoading, isError } = useDashboard();

  if (isLoading) return <DashboardLoading />;

  function getItems(key: SectionKey): TodoDashboardItem[] {
    return data?.[key] ?? [];
  }

  return (
    <main className="max-w-2xl mx-auto p-4">
      {isError && (
        <p role="alert" className="text-red-600 mb-4">
          데이터를 불러오는 중 오류가 발생했습니다.
        </p>
      )}
      {SECTIONS.map(({ key, label }) => (
        <section key={key} data-testid={`section-${key}`} className="mb-6">
          <h2 className="text-lg font-semibold mb-2">{label}</h2>
          <ul>
            {getItems(key).map((item) => (
              <li key={item.id} className="py-1 border-b border-gray-100">
                {item.title}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </main>
  );
}
