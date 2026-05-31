import { render, screen } from '@testing-library/react';
import React from 'react';
import { DashboardSection } from './DashboardSection';
import type { TodoDashboardItem } from '@/types/dashboard';

const makeItem = (overrides: Partial<TodoDashboardItem> = {}): TodoDashboardItem => ({
  id: 'i1',
  title: '할일 제목',
  due_date: null,
  priority: null,
  is_completed: false,
  created_at: null,
  category_id: null,
  category_name: null,
  ...overrides,
});

describe('DashboardSection', () => {
  it('항목이 있으면 헤더와 목록을 렌더링한다', () => {
    render(
      React.createElement(DashboardSection, {
        title: '테스트 섹션',
        items: [makeItem({ title: '할일 A' })],
      }),
    );
    expect(screen.getByText('테스트 섹션')).toBeInTheDocument();
    expect(screen.getByText('할일 A')).toBeInTheDocument();
    expect(screen.getByRole('list')).toBeInTheDocument();
  });

  it('items가 비어 있고 emptyMessage가 있으면 메시지를 표시한다', () => {
    render(
      React.createElement(DashboardSection, {
        title: '오늘 마감',
        items: [],
        emptyMessage: '오늘 마감 없음',
      }),
    );
    expect(screen.getByText('오늘 마감 없음')).toBeInTheDocument();
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });

  it('items가 비어 있고 emptyMessage가 없으면 목록을 렌더링하지 않는다 (빈 ul 없음)', () => {
    render(
      React.createElement(DashboardSection, {
        title: '내일 마감',
        items: [],
      }),
    );
    expect(screen.getByText('내일 마감')).toBeInTheDocument();
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });

  it('titleClassName이 base 클래스에 결합된다', () => {
    render(
      React.createElement(DashboardSection, {
        title: '제목',
        items: [],
        titleClassName: 'text-red-600',
      }),
    );
    const heading = screen.getByText('제목');
    expect(heading).toHaveClass('text-lg', 'font-semibold', 'mb-2', 'text-red-600');
  });

  it('titleClassName이 없을 때 base 클래스만 적용된다', () => {
    render(
      React.createElement(DashboardSection, {
        title: '제목',
        items: [],
      }),
    );
    const heading = screen.getByText('제목');
    expect(heading.className).toBe('text-lg font-semibold mb-2');
  });
});
