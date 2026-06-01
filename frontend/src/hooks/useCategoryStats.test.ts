import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useCategoryStats } from './useCategoryStats';
import * as api from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';
import type { CategoryStatsResponse } from '@/types/stats';

jest.mock('@/lib/api');

const mockCategoryResponse: CategoryStatsResponse = {
  data: [
    { category_id: 'cat-1', category_name: '업무', total_count: 10, completed_count: 8, completion_rate: 80.0 },
    { category_id: 'cat-2', category_name: '운동', total_count: 5, completed_count: 2, completion_rate: 40.0 },
    { category_id: 'cat-3', category_name: '공부', total_count: 8, completed_count: 3, completion_rate: 37.5 },
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

describe('useCategoryStats', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('API를 호출하고 CategoryStatsResponse를 반환한다', async () => {
    (api.getCategoryStats as jest.Mock).mockResolvedValue(mockCategoryResponse);
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useCategoryStats(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(api.getCategoryStats).toHaveBeenCalledTimes(1);
    expect(result.current.data).toEqual(mockCategoryResponse);
    expect(result.current.data?.data).toHaveLength(3);
  });

  it('API 실패 시 isError가 true가 된다', async () => {
    (api.getCategoryStats as jest.Mock).mockRejectedValue(new Error('카테고리 통계 조회 오류: 500'));
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useCategoryStats(), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.data).toBeUndefined();
  });

  it('쿼리 키가 queryKeys.stats.category()를 사용한다', async () => {
    (api.getCategoryStats as jest.Mock).mockResolvedValue(mockCategoryResponse);
    const { queryClient, wrapper } = createWrapper();

    renderHook(() => useCategoryStats(), { wrapper });

    await waitFor(() =>
      expect(
        queryClient.getQueryState(queryKeys.stats.category()),
      ).toBeDefined(),
    );
  });
});
