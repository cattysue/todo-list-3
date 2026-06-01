import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useCompleteTodo } from './useCompleteTodo';
import * as api from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';
import type { DashboardResponse } from '@/types/dashboard';

jest.mock('@/lib/api');

const mockItem = {
  id: 'todo-1',
  title: '테스트 할일',
  due_date: '2026-06-01',
  priority: 'high' as const,
  is_completed: false,
  created_at: null,
  category_id: null,
  category_name: null,
  recurrence_type: null as null,
  recurrence_paused: false,
};

const mockDashboardData: DashboardResponse = {
  overdue: [],
  today: [mockItem],
  tomorrow: [],
  this_week: [],
};

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  queryClient.setQueryData(queryKeys.todos.dashboard(), mockDashboardData);
  return {
    queryClient,
    wrapper: ({ children }: { children: React.ReactNode }) =>
      React.createElement(QueryClientProvider, { client: queryClient }, children),
  };
}

describe('useCompleteTodo', () => {
  beforeEach(() => {
    jest.spyOn(window, 'alert').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('성공 시 대시보드 캐시에서 해당 아이템을 즉시 제거한다', async () => {
    (api.completeTodo as jest.Mock).mockResolvedValue(undefined);

    const { queryClient, wrapper } = createWrapper();
    const { result } = renderHook(() => useCompleteTodo(), { wrapper });

    act(() => {
      result.current.mutate('todo-1');
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const cached = queryClient.getQueryData<DashboardResponse>(
      queryKeys.todos.dashboard(),
    );
    expect(cached?.today.find((i) => i.id === 'todo-1')).toBeUndefined();
  });

  it('성공 시 queryKeys.todos.all을 invalidate한다', async () => {
    (api.completeTodo as jest.Mock).mockResolvedValue(undefined);

    const { queryClient, wrapper } = createWrapper();
    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useCompleteTodo(), { wrapper });

    act(() => {
      result.current.mutate('todo-1');
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: queryKeys.todos.all }),
    );
  });

  it('실패 시 이전 캐시 상태로 롤백된다', async () => {
    (api.completeTodo as jest.Mock).mockRejectedValue(new Error('네트워크 오류'));

    const { queryClient, wrapper } = createWrapper();
    const { result } = renderHook(() => useCompleteTodo(), { wrapper });

    act(() => {
      result.current.mutate('todo-1');
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    const cached = queryClient.getQueryData<DashboardResponse>(
      queryKeys.todos.dashboard(),
    );
    expect(cached?.today.find((i) => i.id === 'todo-1')).toBeDefined();
  });

  it('실패 시 한국어 에러 알림을 표시한다', async () => {
    (api.completeTodo as jest.Mock).mockRejectedValue(new Error('네트워크 오류'));

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useCompleteTodo(), { wrapper });

    act(() => {
      result.current.mutate('todo-1');
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(window.alert).toHaveBeenCalledWith(
      '할일 완료 처리 중 오류가 발생했습니다. 다시 시도해 주세요.',
    );
  });

  it('뮤테이션 진행 중 isPending이 true이고 variables에 todoId가 담긴다', async () => {
    let resolve: (v: undefined) => void;
    (api.completeTodo as jest.Mock).mockReturnValue(
      new Promise<undefined>((r) => {
        resolve = r;
      }),
    );

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useCompleteTodo(), { wrapper });

    act(() => {
      result.current.mutate('todo-1');
    });

    await waitFor(() => expect(result.current.isPending).toBe(true));
    expect(result.current.variables).toBe('todo-1');

    act(() => resolve(undefined));
    await waitFor(() => expect(result.current.isPending).toBe(false));
  });
});
