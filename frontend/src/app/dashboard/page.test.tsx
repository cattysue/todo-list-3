import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import DashboardPage from './page';
import * as useDashboardHook from '@/hooks/useDashboard';
import * as useCompleteTodoHook from '@/hooks/useCompleteTodo';

jest.mock('@/hooks/useDashboard');
jest.mock('@/hooks/useCompleteTodo');

const mockDashboardData = {
  overdue: [
    {
      id: 'o1',
      title: '기한 초과 할일',
      due_date: '2026-05-30',
      priority: 'high' as const,
      is_completed: false,
      created_at: null,
      category_id: null,
      category_name: '업무',
    },
  ],
  today: [
    {
      id: 't1',
      title: '오늘 마감 할일',
      due_date: '2026-06-01',
      priority: 'medium' as const,
      is_completed: false,
      created_at: null,
      category_id: null,
      category_name: null,
    },
  ],
  tomorrow: [],
  this_week: [],
};

const mockCompleteTodoReturn = {
  mutate: jest.fn(),
  isPending: false,
  variables: undefined as string | undefined,
  isSuccess: false,
  isError: false,
};

function renderWithQuery(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    React.createElement(QueryClientProvider, { client: queryClient }, ui),
  );
}

describe('DashboardPage', () => {
  beforeEach(() => {
    (useCompleteTodoHook.useCompleteTodo as jest.Mock).mockReturnValue({
      ...mockCompleteTodoReturn,
      mutate: jest.fn(),
    });
  });

  afterEach(() => jest.resetAllMocks());

  it('isLoading 상태에서 스켈레톤 UI를 표시한다 (overdue 제외 3개 섹션)', () => {
    (useDashboardHook.useDashboard as jest.Mock).mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
    });

    renderWithQuery(React.createElement(DashboardPage));

    // overdue 스켈레톤은 CLS 방지를 위해 제외됨
    expect(screen.queryByLabelText('기한 초과 로딩 중')).not.toBeInTheDocument();
    expect(screen.getByLabelText('오늘 마감 로딩 중')).toBeInTheDocument();
    expect(screen.getByLabelText('내일 마감 로딩 중')).toBeInTheDocument();
    expect(screen.getByLabelText('이번 주 마감 로딩 중')).toBeInTheDocument();
    expect(screen.queryByTestId('section-overdue')).not.toBeInTheDocument();
  });

  it('overdue 항목이 있을 때 4개 섹션이 모두 렌더링된다', () => {
    (useDashboardHook.useDashboard as jest.Mock).mockReturnValue({
      data: mockDashboardData,
      isLoading: false,
      isError: false,
      error: null,
    });

    renderWithQuery(React.createElement(DashboardPage));

    expect(screen.getByTestId('section-overdue')).toBeInTheDocument();
    expect(screen.getByTestId('section-today')).toBeInTheDocument();
    expect(screen.getByTestId('section-tomorrow')).toBeInTheDocument();
    expect(screen.getByTestId('section-this_week')).toBeInTheDocument();
  });

  it('overdue 항목이 없으면 section-overdue가 DOM에 렌더링되지 않는다 (AC: 1)', () => {
    (useDashboardHook.useDashboard as jest.Mock).mockReturnValue({
      data: { overdue: [], today: [], tomorrow: [], this_week: [] },
      isLoading: false,
      isError: false,
      error: null,
    });

    renderWithQuery(React.createElement(DashboardPage));

    expect(screen.queryByTestId('section-overdue')).not.toBeInTheDocument();
    expect(screen.getByTestId('section-today')).toBeInTheDocument();
    expect(screen.getByTestId('section-tomorrow')).toBeInTheDocument();
    expect(screen.getByTestId('section-this_week')).toBeInTheDocument();
  });

  it('overdue 항목에 빨간색 강조가 적용된다 (AC: 2)', () => {
    (useDashboardHook.useDashboard as jest.Mock).mockReturnValue({
      data: mockDashboardData,
      isLoading: false,
      isError: false,
      error: null,
    });

    renderWithQuery(React.createElement(DashboardPage));

    const overdueHeading = screen.getByText('기한 초과');
    expect(overdueHeading).toHaveClass('text-red-600');
  });

  it('overdue 항목에 카테고리 이름이 표시된다 (AC: 2)', () => {
    (useDashboardHook.useDashboard as jest.Mock).mockReturnValue({
      data: mockDashboardData,
      isLoading: false,
      isError: false,
      error: null,
    });

    renderWithQuery(React.createElement(DashboardPage));

    expect(screen.getByText('업무')).toBeInTheDocument();
  });

  it('today 항목이 없으면 "오늘 마감 없음" 빈 상태 메시지를 표시한다 (AC: 4)', () => {
    (useDashboardHook.useDashboard as jest.Mock).mockReturnValue({
      data: { overdue: [], today: [], tomorrow: [], this_week: [] },
      isLoading: false,
      isError: false,
      error: null,
    });

    renderWithQuery(React.createElement(DashboardPage));

    expect(screen.getByText('오늘 마감 없음')).toBeInTheDocument();
  });

  it('데이터 로딩 성공 시 할일 제목이 표시된다', () => {
    (useDashboardHook.useDashboard as jest.Mock).mockReturnValue({
      data: mockDashboardData,
      isLoading: false,
      isError: false,
      error: null,
    });

    renderWithQuery(React.createElement(DashboardPage));

    expect(screen.getByText('기한 초과 할일')).toBeInTheDocument();
    expect(screen.getByText('오늘 마감 할일')).toBeInTheDocument();
  });

  it('에러 시 한국어 에러 메시지를 표시한다', () => {
    (useDashboardHook.useDashboard as jest.Mock).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: new Error('API 오류'),
    });

    renderWithQuery(React.createElement(DashboardPage));

    expect(
      screen.getByText('데이터를 불러오는 중 오류가 발생했습니다.'),
    ).toBeInTheDocument();
  });

  it('에러 시 3개 섹션(today, tomorrow, this_week)이 항상 렌더링된다 (앱 크래시 없음)', () => {
    (useDashboardHook.useDashboard as jest.Mock).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: new Error('API 오류'),
    });

    renderWithQuery(React.createElement(DashboardPage));

    // overdue는 데이터 없을 때 숨김 (AC: 1)
    expect(screen.queryByTestId('section-overdue')).not.toBeInTheDocument();
    expect(screen.getByTestId('section-today')).toBeInTheDocument();
    expect(screen.getByTestId('section-tomorrow')).toBeInTheDocument();
    expect(screen.getByTestId('section-this_week')).toBeInTheDocument();
  });

  it('에러 시 today 섹션에 빈 상태 메시지가 표시된다', () => {
    (useDashboardHook.useDashboard as jest.Mock).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: new Error('API 오류'),
    });

    renderWithQuery(React.createElement(DashboardPage));

    expect(screen.getByText('오늘 마감 없음')).toBeInTheDocument();
  });

  it('섹션 헤더가 올바른 한국어 라벨을 가진다 (overdue 데이터 있을 때)', () => {
    (useDashboardHook.useDashboard as jest.Mock).mockReturnValue({
      data: mockDashboardData,
      isLoading: false,
      isError: false,
      error: null,
    });

    renderWithQuery(React.createElement(DashboardPage));

    expect(screen.getByText('기한 초과')).toBeInTheDocument();
    expect(screen.getByText('오늘 마감')).toBeInTheDocument();
    expect(screen.getByText('내일 마감')).toBeInTheDocument();
    expect(screen.getByText('이번 주 마감')).toBeInTheDocument();
  });

  it('섹션 렌더링 순서: 기한 초과가 최상단에 위치한다 (AC: 3, 7)', () => {
    (useDashboardHook.useDashboard as jest.Mock).mockReturnValue({
      data: mockDashboardData,
      isLoading: false,
      isError: false,
      error: null,
    });

    renderWithQuery(React.createElement(DashboardPage));

    const overdue = screen.getByTestId('section-overdue');
    const today = screen.getByTestId('section-today');
    // DOCUMENT_POSITION_FOLLOWING(4): overdue comes before today in DOM
    expect(
      overdue.compareDocumentPosition(today) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it('체크박스 클릭 시 completeTodo mutate가 해당 id로 호출된다 (AC: 1)', () => {
    const mutateFn = jest.fn();
    (useCompleteTodoHook.useCompleteTodo as jest.Mock).mockReturnValue({
      ...mockCompleteTodoReturn,
      mutate: mutateFn,
    });
    (useDashboardHook.useDashboard as jest.Mock).mockReturnValue({
      data: mockDashboardData,
      isLoading: false,
      isError: false,
      error: null,
    });

    renderWithQuery(React.createElement(DashboardPage));

    const todayCheckbox = screen.getByRole('checkbox', { name: '오늘 마감 할일 완료 처리' });
    fireEvent.click(todayCheckbox);
    expect(mutateFn).toHaveBeenCalledWith('t1');
  });

  it('isPending 중인 항목의 체크박스가 비활성화된다 (AC: 4)', () => {
    (useCompleteTodoHook.useCompleteTodo as jest.Mock).mockReturnValue({
      ...mockCompleteTodoReturn,
      isPending: true,
      variables: 't1',
    });
    (useDashboardHook.useDashboard as jest.Mock).mockReturnValue({
      data: mockDashboardData,
      isLoading: false,
      isError: false,
      error: null,
    });

    renderWithQuery(React.createElement(DashboardPage));

    expect(
      screen.getByRole('checkbox', { name: '오늘 마감 할일 완료 처리' }),
    ).toBeDisabled();
    // isPending 중이면 모든 섹션의 체크박스가 비활성화됨
    expect(
      screen.getByRole('checkbox', { name: '기한 초과 할일 완료 처리' }),
    ).toBeDisabled();
  });
});
