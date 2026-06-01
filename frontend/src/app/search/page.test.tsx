import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import SearchPage from './page';
import * as useSearchTodosHook from '@/hooks/useSearchTodos';

jest.mock('@/hooks/useSearchTodos');

const mockItems = [
  {
    id: '1',
    title: '프로젝트 기획서 작성',
    due_date: '2026-06-10',
    priority: 'high' as const,
    is_completed: false,
    created_at: null,
    category_id: 'cat-1',
    category_name: '업무',
  },
  {
    id: '2',
    title: '장보기',
    due_date: null,
    priority: 'low' as const,
    is_completed: true,
    created_at: null,
    category_id: null,
    category_name: null,
  },
];

function renderWithQuery(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    React.createElement(QueryClientProvider, { client: queryClient }, ui),
  );
}

describe('SearchPage', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('페이지 제목이 렌더링된다', () => {
    (useSearchTodosHook.useSearchTodos as jest.Mock).mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      debouncedQuery: '',
    });
    renderWithQuery(<SearchPage />);
    expect(screen.getByText('할일 검색')).toBeInTheDocument();
  });

  it('검색 입력 필드가 렌더링된다', () => {
    (useSearchTodosHook.useSearchTodos as jest.Mock).mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      debouncedQuery: '',
    });
    renderWithQuery(<SearchPage />);
    expect(screen.getByLabelText('할일 검색')).toBeInTheDocument();
  });

  it('초기 로드 시 전체 목록(빈 쿼리)이 표시된다', () => {
    (useSearchTodosHook.useSearchTodos as jest.Mock).mockReturnValue({
      data: mockItems,
      isLoading: false,
      isError: false,
      debouncedQuery: '',
    });
    renderWithQuery(<SearchPage />);
    expect(screen.getByText('프로젝트 기획서 작성')).toBeInTheDocument();
    expect(screen.getByText('장보기')).toBeInTheDocument();
  });

  it('검색 결과 항목에 제목이 표시된다', () => {
    (useSearchTodosHook.useSearchTodos as jest.Mock).mockReturnValue({
      data: mockItems,
      isLoading: false,
      isError: false,
      debouncedQuery: '프로젝트',
    });
    renderWithQuery(<SearchPage />);
    expect(screen.getByText('프로젝트 기획서 작성')).toBeInTheDocument();
  });

  it('검색 결과 항목에 마감일이 표시된다', () => {
    (useSearchTodosHook.useSearchTodos as jest.Mock).mockReturnValue({
      data: [mockItems[0]],
      isLoading: false,
      isError: false,
      debouncedQuery: '프로젝트',
    });
    renderWithQuery(<SearchPage />);
    expect(screen.getByText(/마감:/)).toBeInTheDocument();
  });

  it('검색 결과 항목에 우선순위가 표시된다', () => {
    (useSearchTodosHook.useSearchTodos as jest.Mock).mockReturnValue({
      data: [mockItems[0]],
      isLoading: false,
      isError: false,
      debouncedQuery: '프로젝트',
    });
    renderWithQuery(<SearchPage />);
    expect(screen.getByText(/우선순위:/)).toBeInTheDocument();
  });

  it('검색 결과 항목에 카테고리 이름이 표시된다', () => {
    (useSearchTodosHook.useSearchTodos as jest.Mock).mockReturnValue({
      data: [mockItems[0]],
      isLoading: false,
      isError: false,
      debouncedQuery: '프로젝트',
    });
    renderWithQuery(<SearchPage />);
    expect(screen.getByText('업무')).toBeInTheDocument();
  });

  it('결과 없음 — debouncedQuery 있고 results 빈 배열 시 "검색 결과 없음" 표시', () => {
    (useSearchTodosHook.useSearchTodos as jest.Mock).mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      debouncedQuery: '없는검색어',
    });
    renderWithQuery(<SearchPage />);
    expect(screen.getByText('검색 결과 없음')).toBeInTheDocument();
  });

  it('debouncedQuery 없고 results 빈 배열 시 "검색 결과 없음" 미표시', () => {
    (useSearchTodosHook.useSearchTodos as jest.Mock).mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      debouncedQuery: '',
    });
    renderWithQuery(<SearchPage />);
    expect(screen.queryByText('검색 결과 없음')).not.toBeInTheDocument();
  });

  it('로딩 중 "검색 중..." 표시', () => {
    (useSearchTodosHook.useSearchTodos as jest.Mock).mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      debouncedQuery: '검색',
    });
    renderWithQuery(<SearchPage />);
    expect(screen.getByText('검색 중...')).toBeInTheDocument();
  });

  it('에러 시 한국어 에러 메시지 표시', () => {
    (useSearchTodosHook.useSearchTodos as jest.Mock).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      debouncedQuery: '검색',
    });
    renderWithQuery(<SearchPage />);
    expect(screen.getByText(/오류가 발생했습니다/)).toBeInTheDocument();
  });
});
