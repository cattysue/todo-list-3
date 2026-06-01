import { render, screen } from '@testing-library/react';
import React from 'react';
import { TodaySection } from './TodaySection';
import type { TodoDashboardItem } from '@/types/dashboard';

const makeItem = (overrides: Partial<TodoDashboardItem> = {}): TodoDashboardItem => ({
  id: 't1',
  title: '오늘 마감 할일',
  due_date: '2026-06-01',
  priority: 'medium',
  is_completed: false,
  created_at: null,
  category_id: null,
  category_name: null,
  recurrence_type: null,
  recurrence_paused: false,
  ...overrides,
});

describe('TodaySection', () => {
  it('items가 비어 있어도 "오늘 마감" 헤더를 항상 표시한다', () => {
    render(React.createElement(TodaySection, { items: [] }));
    expect(screen.getByText('오늘 마감')).toBeInTheDocument();
  });

  it('items가 없으면 "오늘 마감 없음" 빈 상태 메시지를 표시한다', () => {
    render(React.createElement(TodaySection, { items: [] }));
    expect(screen.getByText('오늘 마감 없음')).toBeInTheDocument();
  });

  it('items가 없으면 목록(ul)을 렌더링하지 않는다', () => {
    render(React.createElement(TodaySection, { items: [] }));
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });

  it('items가 있으면 할일 제목을 표시한다', () => {
    render(
      React.createElement(TodaySection, {
        items: [makeItem({ title: '오늘 할 일' })],
      }),
    );
    expect(screen.getByText('오늘 할 일')).toBeInTheDocument();
  });

  it('items가 있으면 "오늘 마감 없음" 메시지를 표시하지 않는다', () => {
    render(
      React.createElement(TodaySection, {
        items: [makeItem()],
      }),
    );
    expect(screen.queryByText('오늘 마감 없음')).not.toBeInTheDocument();
  });

  it('여러 items를 API 응답 순서 그대로 표시한다', () => {
    const items = [
      makeItem({ id: 't1', title: '첫 번째 할일' }),
      makeItem({ id: 't2', title: '두 번째 할일' }),
      makeItem({ id: 't3', title: '세 번째 할일' }),
    ];
    render(React.createElement(TodaySection, { items }));
    const listItems = screen.getAllByRole('listitem');
    expect(listItems[0]).toHaveTextContent('첫 번째 할일');
    expect(listItems[1]).toHaveTextContent('두 번째 할일');
    expect(listItems[2]).toHaveTextContent('세 번째 할일');
  });
});
