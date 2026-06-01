'use client';

import { useState } from 'react';
import { useCompletionStats } from '@/hooks/useCompletionStats';
import { useCategoryStats } from '@/hooks/useCategoryStats';
import { CompletionChart } from '@/components/stats/CompletionChart';
import { CategoryChart } from '@/components/stats/CategoryChart';
import type { StatsPeriod } from '@/types/stats';

export default function StatsPage() {
  const [period, setPeriod] = useState<StatsPeriod>('weekly');
  const { data, isLoading, isError } = useCompletionStats(period);
  const {
    data: categoryData,
    isLoading: isCategoryLoading,
    isError: isCategoryError,
  } = useCategoryStats();

  return (
    <main className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">생산성 통계</h1>

      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setPeriod('weekly')}
          className={[
            'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
            period === 'weekly'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
          ].join(' ')}
        >
          주간
        </button>
        <button
          onClick={() => setPeriod('monthly')}
          className={[
            'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
            period === 'monthly'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
          ].join(' ')}
        >
          월간
        </button>
      </div>

      <section className="bg-white rounded-lg border border-gray-200 p-4">
        <h2 className="text-lg font-semibold mb-4">
          {period === 'weekly' ? '주간 완료 현황 (최근 8주)' : '월간 완료 현황 (최근 6개월)'}
        </h2>

        {isLoading && (
          <div className="h-72 flex items-center justify-center text-gray-400">
            데이터를 불러오는 중...
          </div>
        )}

        {isError && (
          <div className="h-72 flex items-center justify-center text-red-500" role="alert">
            통계를 불러오는 중 오류가 발생했습니다.
          </div>
        )}

        {!isLoading && !isError && data && (
          <CompletionChart data={data.data} />
        )}
      </section>

      <section className="bg-white rounded-lg border border-gray-200 p-4 mt-6">
        <h2 className="text-lg font-semibold mb-4">카테고리별 완료율</h2>

        {isCategoryLoading && (
          <div className="flex items-center justify-center text-gray-400" style={{ height: 200 }}>
            데이터를 불러오는 중...
          </div>
        )}

        {isCategoryError && (
          <div className="flex items-center justify-center text-red-500" role="alert" style={{ height: 200 }}>
            통계를 불러오는 중 오류가 발생했습니다.
          </div>
        )}

        {!isCategoryLoading && !isCategoryError && categoryData && categoryData.data.length === 0 && (
          <div className="flex items-center justify-center text-gray-400" style={{ height: 200 }}>
            분석할 데이터가 없습니다.
          </div>
        )}

        {!isCategoryLoading && !isCategoryError && categoryData && categoryData.data.length > 0 && (
          <CategoryChart data={categoryData.data} />
        )}
      </section>
    </main>
  );
}
