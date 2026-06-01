import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useCompletionStats } from './useCompletionStats';
import * as api from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';
import type { CompletionStatsResponse } from '@/types/stats';

jest.mock('@/lib/api');

const mockWeeklyResponse: CompletionStatsResponse = {
  period: 'weekly',
  data: [
    { label: '2026-W18', completed_count: 3, total_count: 5, completion_rate: 60.0 },
    { label: '2026-W19', completed_count: 2, total_count: 4, completion_rate: 50.0 },
    { label: '2026-W20', completed_count: 5, total_count: 5, completion_rate: 100.0 },
    { label: '2026-W21', completed_count: 1, total_count: 3, completion_rate: 33.3 },
    { label: '2026-W22', completed_count: 0, total_count: 2, completion_rate: 0.0 },
    { label: '2026-W23', completed_count: 4, total_count: 4, completion_rate: 100.0 },
    { label: '2026-W24', completed_count: 2, total_count: 6, completion_rate: 33.3 },
    { label: '2026-W25', completed_count: 1, total_count: 1, completion_rate: 100.0 },
  ],
};

const mockMonthlyResponse: CompletionStatsResponse = {
  period: 'monthly',
  data: [
    { label: '2026-01', completed_count: 10, total_count: 15, completion_rate: 66.7 },
    { label: '2026-02', completed_count: 8, total_count: 12, completion_rate: 66.7 },
    { label: '2026-03', completed_count: 12, total_count: 14, completion_rate: 85.7 },
    { label: '2026-04', completed_count: 5, total_count: 10, completion_rate: 50.0 },
    { label: '2026-05', completed_count: 9, total_count: 11, completion_rate: 81.8 },
    { label: '2026-06', completed_count: 3, total_count: 5, completion_rate: 60.0 },
  ],
};

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return {
    queryClient,
    wrapper: ({ children }: { children: React.ReactNode }) =>
      React.createElement(QueryClientProvider, { client: queryClient }, children),
  };
}

describe('useCompletionStats', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('주간 뷰에서 올바른 파라미터로 API를 호출한다', async () => {
    (api.getCompletionStats as jest.Mock).mockResolvedValue(mockWeeklyResponse);
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useCompletionStats('weekly'), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(api.getCompletionStats).toHaveBeenCalledWith('weekly', 8);
  });

  it('월간 뷰에서 올바른 파라미터로 API를 호출한다', async () => {
    (api.getCompletionStats as jest.Mock).mockResolvedValue(mockMonthlyResponse);
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useCompletionStats('monthly'), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(api.getCompletionStats).toHaveBeenCalledWith('monthly', 6);
  });

  it('성공 시 CompletionStatsResponse 데이터를 반환한다', async () => {
    (api.getCompletionStats as jest.Mock).mockResolvedValue(mockWeeklyResponse);
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useCompletionStats('weekly'), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockWeeklyResponse);
    expect(result.current.data?.data).toHaveLength(8);
    expect(result.current.data?.period).toBe('weekly');
  });

  it('실패 시 isError가 true가 된다', async () => {
    (api.getCompletionStats as jest.Mock).mockRejectedValue(new Error('통계 조회 오류: 500'));
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useCompletionStats('weekly'), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.data).toBeUndefined();
  });

  it('주간 뷰 쿼리 키가 queryKeys.stats.completion을 사용한다', async () => {
    (api.getCompletionStats as jest.Mock).mockResolvedValue(mockWeeklyResponse);
    const { queryClient, wrapper } = createWrapper();

    renderHook(() => useCompletionStats('weekly'), { wrapper });

    await waitFor(() =>
      expect(
        queryClient.getQueryState(queryKeys.stats.completion('weekly', 8)),
      ).toBeDefined(),
    );
  });
});
