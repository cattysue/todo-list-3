import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useDashboard } from './useDashboard';
import * as api from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';

jest.mock('@/lib/api');

const mockData = {
  overdue: [],
  today: [
    {
      id: 'uuid-1',
      title: '오늘 할 일',
      due_date: '2026-06-01',
      priority: 'high' as const,
      is_completed: false,
      created_at: null,
      category_id: null,
      category_name: null,
    },
  ],
  tomorrow: [],
  this_week: [],
};

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
}

describe('useDashboard', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('초기 상태: isLoading이 true이다', () => {
    (api.getDashboardTodos as jest.Mock).mockResolvedValue(mockData);
    const wrapper = createWrapper();
    const { result } = renderHook(() => useDashboard(), { wrapper });
    expect(result.current.isLoading).toBe(true);
  });

  it('성공 시 data를 반환한다', async () => {
    (api.getDashboardTodos as jest.Mock).mockResolvedValue(mockData);
    const wrapper = createWrapper();
    const { result } = renderHook(() => useDashboard(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.data).toEqual(mockData);
    expect(result.current.isError).toBe(false);
  });

  it('API 실패 시 isError가 true이다', async () => {
    (api.getDashboardTodos as jest.Mock).mockRejectedValue(
      new Error('API 오류: 500'),
    );
    const wrapper = createWrapper();
    const { result } = renderHook(() => useDashboard(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.isError).toBe(true);
    expect(result.current.data).toBeUndefined();
  });

  it('queryKeys.todos.dashboard() 키를 사용한다', async () => {
    (api.getDashboardTodos as jest.Mock).mockResolvedValue(mockData);
    const expectedKey = queryKeys.todos.dashboard();
    expect(expectedKey).toEqual(['todos', 'dashboard']);
  });
});
