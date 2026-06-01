import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import SearchPage from './page';
import * as useSearchTodosHook from '@/hooks/useSearchTodos';
import * as useCategoriesHook from '@/hooks/useCategories';

jest.mock('@/hooks/useSearchTodos');
jest.mock('@/hooks/useCategories');

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

const mockCategories = [
  { id: 'cat-1', name: '업무' },
  { id: 'cat-2', name: '개인' },
];

function mockSearchTodos(overrides = {}) {
  (useSearchTodosHook.useSearchTodos as jest.Mock).mockReturnValue({
    data: [],
    isFetching: false,
    isError: false,
    debouncedQuery: '',
    ...overrides,
  });
}

function mockCategories_() {
  (useCategoriesHook.useCategories as jest.Mock).mockReturnValue({
    data: mockCategories,
  });
}

function renderWithQuery(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    React.createElement(QueryClientProvider, { client: queryClient }, ui),
  );
}

describe('SearchPage', () => {
  beforeEach(() => {
    mockCategories_();
    (useSearchTodosHook.hasActiveFilters as jest.Mock) = jest.fn().mockReturnValue(false);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('페이지 제목이 렌더링된다', () => {
    mockSearchTodos();
    renderWithQuery(<SearchPage />);
    expect(screen.getByText('할일 검색')).toBeInTheDocument();
  });

  it('검색 입력 필드가 렌더링된다', () => {
    mockSearchTodos();
    renderWithQuery(<SearchPage />);
    expect(screen.getByLabelText('할일 검색')).toBeInTheDocument();
  });

  it('FilterBar가 렌더링된다 — 우선순위 select 존재', () => {
    mockSearchTodos();
    renderWithQuery(<SearchPage />);
    expect(screen.getByLabelText('우선순위 필터')).toBeInTheDocument();
  });

  it('카테고리 목록이 FilterBar에 전달된다', () => {
    mockSearchTodos();
    renderWithQuery(<SearchPage />);
    expect(screen.getByText('업무')).toBeInTheDocument();
  });

  it('초기 로드 시 전체 목록(빈 쿼리)이 표시된다', () => {
    mockSearchTodos({ data: mockItems, debouncedQuery: '' });
    renderWithQuery(<SearchPage />);
    expect(screen.getByText('프로젝트 기획서 작성')).toBeInTheDocument();
    expect(screen.getByText('장보기')).toBeInTheDocument();
  });

  it('검색 결과 항목에 제목이 표시된다', () => {
    mockSearchTodos({ data: mockItems, debouncedQuery: '프로젝트' });
    renderWithQuery(<SearchPage />);
    expect(screen.getByText('프로젝트 기획서 작성')).toBeInTheDocument();
  });

  it('검색 결과 항목에 마감일이 표시된다', () => {
    mockSearchTodos({ data: [mockItems[0]], debouncedQuery: '프로젝트' });
    renderWithQuery(<SearchPage />);
    expect(screen.getByText(/마감:/)).toBeInTheDocument();
  });

  it('검색 결과 항목에 우선순위가 표시된다', () => {
    mockSearchTodos({ data: [mockItems[0]], debouncedQuery: '프로젝트' });
    renderWithQuery(<SearchPage />);
    expect(screen.getByText(/우선순위:/)).toBeInTheDocument();
  });

  it('검색 결과 항목에 카테고리 이름이 표시된다', () => {
    mockSearchTodos({ data: [mockItems[0]], debouncedQuery: '프로젝트' });
    renderWithQuery(<SearchPage />);
    // category_name이 업무인 항목 (카테고리 select 옵션과 구분)
    const els = screen.getAllByText('업무');
    expect(els.length).toBeGreaterThanOrEqual(1);
  });

  it('결과 없음 — debouncedQuery 있고 results 빈 배열 시 "검색 결과 없음" 표시', () => {
    (useSearchTodosHook.hasActiveFilters as jest.Mock).mockReturnValue(false);
    mockSearchTodos({ data: [], debouncedQuery: '없는검색어' });
    renderWithQuery(<SearchPage />);
    expect(screen.getByText('검색 결과 없음')).toBeInTheDocument();
  });

  it('debouncedQuery 없고 filters 없고 results 빈 배열 시 "검색 결과 없음" 미표시', () => {
    (useSearchTodosHook.hasActiveFilters as jest.Mock).mockReturnValue(false);
    mockSearchTodos({ data: [], debouncedQuery: '' });
    renderWithQuery(<SearchPage />);
    expect(screen.queryByText('검색 결과 없음')).not.toBeInTheDocument();
  });

  it('filters 적용되고 results 빈 배열 시 "검색 결과 없음" 표시', () => {
    (useSearchTodosHook.hasActiveFilters as jest.Mock).mockReturnValue(true);
    mockSearchTodos({ data: [], debouncedQuery: '' });
    renderWithQuery(<SearchPage />);
    expect(screen.getByText('검색 결과 없음')).toBeInTheDocument();
  });

  it('로딩 중 "검색 중..." 표시', () => {
    mockSearchTodos({ data: undefined, isFetching: true, debouncedQuery: '검색' });
    renderWithQuery(<SearchPage />);
    expect(screen.getByText('검색 중...')).toBeInTheDocument();
  });

  it('에러 시 한국어 에러 메시지 표시', () => {
    mockSearchTodos({ data: undefined, isFetching: false, isError: true, debouncedQuery: '검색' });
    renderWithQuery(<SearchPage />);
    expect(screen.getByText(/오류가 발생했습니다/)).toBeInTheDocument();
  });

  it('필터 태그 — priority 필터 적용 시 태그가 표시된다', () => {
    (useSearchTodosHook.hasActiveFilters as jest.Mock).mockReturnValue(true);
    mockSearchTodos({ data: [], debouncedQuery: '' });
    renderWithQuery(<SearchPage />);
    // FilterBar에서 우선순위 선택
    fireEvent.change(screen.getByLabelText('우선순위 필터'), {
      target: { value: 'high' },
    });
    expect(screen.getByText('높은 우선순위')).toBeInTheDocument();
  });

  it('필터 태그 삭제 버튼 클릭 시 해당 태그 사라짐', () => {
    (useSearchTodosHook.hasActiveFilters as jest.Mock).mockReturnValue(true);
    mockSearchTodos({ data: [], debouncedQuery: '' });
    renderWithQuery(<SearchPage />);

    // priority 필터 적용
    fireEvent.change(screen.getByLabelText('우선순위 필터'), {
      target: { value: 'high' },
    });
    expect(screen.getByText('높은 우선순위')).toBeInTheDocument();

    // 태그 삭제
    fireEvent.click(screen.getByLabelText('높은 우선순위 필터 제거'));
    expect(screen.queryByText('높은 우선순위')).not.toBeInTheDocument();
  });
});
