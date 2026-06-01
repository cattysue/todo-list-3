import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useSearchTodos } from './useSearchTodos';
import * as api from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';

jest.mock('@/lib/api');
jest.mock('@/hooks/useDebounce', () => ({
  useDebounce: (value: string) => value,
}));

const mockItems = [
  {
    id: '1',
    title: '프로젝트 기획',
    due_date: '2026-06-10',
    priority: 'high' as const,
    is_completed: false,
    created_at: null,
    category_id: null,
    category_name: '업무',
  },
];

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
}

describe('useSearchTodos', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('빈 query로 searchTodos("") 호출', async () => {
    (api.searchTodos as jest.Mock).mockResolvedValue([]);
    const wrapper = createWrapper();
    const { result } = renderHook(() => useSearchTodos(''), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(api.searchTodos).toHaveBeenCalledWith('');
  });

  it('query 있을 때 searchTodos(q) 호출', async () => {
    (api.searchTodos as jest.Mock).mockResolvedValue(mockItems);
    const wrapper = createWrapper();
    const { result } = renderHook(() => useSearchTodos('프로젝트'), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(api.searchTodos).toHaveBeenCalledWith('프로젝트');
    expect(result.current.data).toEqual(mockItems);
  });

  it('성공 시 data를 반환한다', async () => {
    (api.searchTodos as jest.Mock).mockResolvedValue(mockItems);
    const wrapper = createWrapper();
    const { result } = renderHook(() => useSearchTodos('프로젝트'), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.data).toEqual(mockItems);
    expect(result.current.isError).toBe(false);
  });

  it('API 실패 시 isError가 true이다', async () => {
    (api.searchTodos as jest.Mock).mockRejectedValue(new Error('검색 오류: 500'));
    const wrapper = createWrapper();
    const { result } = renderHook(() => useSearchTodos('에러'), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.isError).toBe(true);
  });

  it('debouncedQuery를 반환한다', async () => {
    (api.searchTodos as jest.Mock).mockResolvedValue([]);
    const wrapper = createWrapper();
    const { result } = renderHook(() => useSearchTodos('테스트'), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.debouncedQuery).toBe('테스트');
  });

  it('queryKeys.todos.search(q) 키 형식 검증', () => {
    expect(queryKeys.todos.search('abc')).toEqual(['todos', 'search', 'abc']);
    expect(queryKeys.todos.search('')).toEqual(['todos', 'search', '']);
  });

  it('todos.all 하위 키 — invalidateQueries(todos.all)로 무효화 가능', () => {
    const key = queryKeys.todos.search('test');
    const allKey = queryKeys.todos.all;
    // ['todos', 'search', 'test']는 ['todos']로 시작
    expect(key[0]).toBe(allKey[0]);
  });
});
