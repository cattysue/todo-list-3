import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import DashboardPage from './page';
import * as useDashboardHook from '@/hooks/useDashboard';

jest.mock('@/hooks/useDashboard');

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

function renderWithQuery(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    React.createElement(QueryClientProvider, { client: queryClient }, ui),
  );
}

describe('DashboardPage', () => {
  afterEach(() => jest.resetAllMocks());

  it('isLoading 상태에서 스켈레톤 UI를 표시한다', () => {
    (useDashboardHook.useDashboard as jest.Mock).mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
    });

    renderWithQuery(React.createElement(DashboardPage));

    // DashboardLoading renders sections with aria-label "X 로딩 중"
    expect(screen.getByLabelText('기한 초과 로딩 중')).toBeInTheDocument();
    expect(screen.getByLabelText('오늘 마감 로딩 중')).toBeInTheDocument();
    expect(screen.queryByTestId('section-overdue')).not.toBeInTheDocument();
  });

  it('4개 섹션이 모두 렌더링된다', () => {
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

  it('에러 시에도 4개 섹션 영역이 렌더링된다 (앱 크래시 없음)', () => {
    (useDashboardHook.useDashboard as jest.Mock).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: new Error('API 오류'),
    });

    renderWithQuery(React.createElement(DashboardPage));

    expect(screen.getByTestId('section-overdue')).toBeInTheDocument();
    expect(screen.getByTestId('section-today')).toBeInTheDocument();
    expect(screen.getByTestId('section-tomorrow')).toBeInTheDocument();
    expect(screen.getByTestId('section-this_week')).toBeInTheDocument();
  });

  it('에러 시 빈 섹션들이 표시된다 (빈 목록)', () => {
    (useDashboardHook.useDashboard as jest.Mock).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: new Error('API 오류'),
    });

    renderWithQuery(React.createElement(DashboardPage));

    const lists = screen.getAllByRole('list');
    lists.forEach((list) => {
      expect(list).toBeEmptyDOMElement();
    });
  });

  it('각 섹션 헤더가 올바른 한국어 라벨을 가진다', () => {
    (useDashboardHook.useDashboard as jest.Mock).mockReturnValue({
      data: { overdue: [], today: [], tomorrow: [], this_week: [] },
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
});
