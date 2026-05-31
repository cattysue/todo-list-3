import { render, screen } from '@testing-library/react';
import React from 'react';
import { OverdueSection } from './OverdueSection';
import type { TodoDashboardItem } from '@/types/dashboard';

const makeItem = (overrides: Partial<TodoDashboardItem> = {}): TodoDashboardItem => ({
  id: 'o1',
  title: '기한 초과 할일',
  due_date: '2026-05-30',
  priority: 'high',
  is_completed: false,
  created_at: null,
  category_id: null,
  category_name: null,
  ...overrides,
});

describe('OverdueSection', () => {
  it('items가 비어 있으면 null을 반환한다 (DOM에 렌더링 안 됨)', () => {
    const { container } = render(React.createElement(OverdueSection, { items: [] }));
    expect(container).toBeEmptyDOMElement();
  });

  it('items가 있으면 "기한 초과" 헤더를 표시한다', () => {
    render(React.createElement(OverdueSection, { items: [makeItem()] }));
    expect(screen.getByText('기한 초과')).toBeInTheDocument();
  });

  it('헤더에 빨간색 클래스가 적용된다', () => {
    render(React.createElement(OverdueSection, { items: [makeItem()] }));
    const heading = screen.getByText('기한 초과');
    expect(heading).toHaveClass('text-red-600');
  });

  it('각 항목의 제목을 표시한다', () => {
    const items = [
      makeItem({ id: 'o1', title: '할일 A' }),
      makeItem({ id: 'o2', title: '할일 B' }),
    ];
    render(React.createElement(OverdueSection, { items }));
    expect(screen.getByText('할일 A')).toBeInTheDocument();
    expect(screen.getByText('할일 B')).toBeInTheDocument();
  });

  it('category_name이 있으면 카테고리 이름을 표시한다', () => {
    render(
      React.createElement(OverdueSection, {
        items: [makeItem({ category_name: '업무' })],
      }),
    );
    expect(screen.getByText('업무')).toBeInTheDocument();
  });

  it('category_name이 null이면 카테고리 이름을 표시하지 않는다', () => {
    render(
      React.createElement(OverdueSection, {
        items: [makeItem({ category_name: null })],
      }),
    );
    expect(screen.queryByText('업무')).not.toBeInTheDocument();
  });
});
