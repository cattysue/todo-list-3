import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useDragDueDate } from './useDragDueDate';
import * as api from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';
import type { TodoCalendarItem } from '@/types/calendar';

jest.mock('@/lib/api');

const START = '2026-06-01';
const END = '2026-06-30';

const mockTodo: TodoCalendarItem = {
  id: 'todo-1',
  title: '운동',
  due_date: '2026-06-10',
  priority: 'high',
  is_completed: false,
  category_name: null,
  category_id: null,
};

const mockTodos: TodoCalendarItem[] = [mockTodo];

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  queryClient.setQueryData(queryKeys.todos.calendar(START, END), mockTodos);
  return {
    queryClient,
    wrapper: ({ children }: { children: React.ReactNode }) =>
      React.createElement(QueryClientProvider, { client: queryClient }, children),
  };
}

const dragVars = {
  todoId: 'todo-1',
  newDueDate: '2026-06-15',
  previousDueDate: '2026-06-10',
  calendarStart: START,
  calendarEnd: END,
};

describe('useDragDueDate', () => {
  beforeEach(() => {
    jest.spyOn(window, 'alert').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('성공 시 캘린더 캐시에서 해당 할일의 due_date가 새 날짜로 변경된다', async () => {
    (api.updateTodoDueDate as jest.Mock).mockResolvedValue(undefined);

    const { queryClient, wrapper } = createWrapper();
    const { result } = renderHook(() => useDragDueDate(), { wrapper });

    act(() => {
      result.current.mutate(dragVars);
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const cached = queryClient.getQueryData<TodoCalendarItem[]>(
      queryKeys.todos.calendar(START, END),
    );
    const updated = cached?.find((t) => t.id === 'todo-1');
    expect(updated?.due_date).toBe('2026-06-15');
  });

  it('성공 시 queryKeys.todos.all을 invalidate한다', async () => {
    (api.updateTodoDueDate as jest.Mock).mockResolvedValue(undefined);

    const { queryClient, wrapper } = createWrapper();
    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');
    const { result } = renderHook(() => useDragDueDate(), { wrapper });

    act(() => {
      result.current.mutate(dragVars);
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: queryKeys.todos.all }),
    );
  });

  it('실패 시 이전 캘린더 캐시로 롤백된다', async () => {
    (api.updateTodoDueDate as jest.Mock).mockRejectedValue(new Error('네트워크 오류'));

    const { queryClient, wrapper } = createWrapper();
    const { result } = renderHook(() => useDragDueDate(), { wrapper });

    act(() => {
      result.current.mutate(dragVars);
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    const cached = queryClient.getQueryData<TodoCalendarItem[]>(
      queryKeys.todos.calendar(START, END),
    );
    const rolledBack = cached?.find((t) => t.id === 'todo-1');
    expect(rolledBack?.due_date).toBe('2026-06-10');
  });

  it('실패 시 한국어 에러 알림을 표시한다', async () => {
    (api.updateTodoDueDate as jest.Mock).mockRejectedValue(new Error('네트워크 오류'));

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useDragDueDate(), { wrapper });

    act(() => {
      result.current.mutate(dragVars);
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(window.alert).toHaveBeenCalledWith(
      '마감일 변경 중 오류가 발생했습니다. 다시 시도해 주세요.',
    );
  });
});
