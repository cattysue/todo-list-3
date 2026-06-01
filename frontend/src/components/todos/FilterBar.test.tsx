import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import FilterBar from './FilterBar';
import type { CategoryItem, SearchFilters } from '@/types/filters';

const categories: CategoryItem[] = [
  { id: 'cat-1', name: '업무' },
  { id: 'cat-2', name: '개인' },
];

function renderFilterBar(
  filters: SearchFilters = {},
  onFilterChange = jest.fn(),
  cats = categories,
) {
  return render(
    <FilterBar filters={filters} onFilterChange={onFilterChange} categories={cats} />,
  );
}

describe('FilterBar', () => {
  it('우선순위 select가 렌더링된다', () => {
    renderFilterBar();
    expect(screen.getByLabelText('우선순위 필터')).toBeInTheDocument();
  });

  it('완료 여부 select가 렌더링된다', () => {
    renderFilterBar();
    expect(screen.getByLabelText('완료 여부 필터')).toBeInTheDocument();
  });

  it('카테고리 select가 렌더링된다', () => {
    renderFilterBar();
    expect(screen.getByLabelText('카테고리 필터')).toBeInTheDocument();
  });

  it('카테고리 목록이 select에 표시된다', () => {
    renderFilterBar();
    expect(screen.getByText('업무')).toBeInTheDocument();
    expect(screen.getByText('개인')).toBeInTheDocument();
  });

  it('마감일 시작 input이 렌더링된다', () => {
    renderFilterBar();
    expect(screen.getByLabelText('마감일 시작')).toBeInTheDocument();
  });

  it('마감일 종료 input이 렌더링된다', () => {
    renderFilterBar();
    expect(screen.getByLabelText('마감일 종료')).toBeInTheDocument();
  });

  it('이번 주 버튼이 렌더링된다', () => {
    renderFilterBar();
    expect(screen.getByText('이번 주')).toBeInTheDocument();
  });

  it('우선순위 선택 시 onFilterChange 호출', () => {
    const onFilterChange = jest.fn();
    renderFilterBar({}, onFilterChange);
    fireEvent.change(screen.getByLabelText('우선순위 필터'), {
      target: { value: 'high' },
    });
    expect(onFilterChange).toHaveBeenCalledWith(
      expect.objectContaining({ priority: 'high' }),
    );
  });

  it('우선순위 "전체" 선택 시 priority 키 제거', () => {
    const onFilterChange = jest.fn();
    renderFilterBar({ priority: 'high' }, onFilterChange);
    fireEvent.change(screen.getByLabelText('우선순위 필터'), {
      target: { value: '' },
    });
    const called = onFilterChange.mock.calls[0][0] as SearchFilters;
    expect(called.priority).toBeUndefined();
  });

  it('완료 여부 "미완료" 선택 시 onFilterChange 호출', () => {
    const onFilterChange = jest.fn();
    renderFilterBar({}, onFilterChange);
    fireEvent.change(screen.getByLabelText('완료 여부 필터'), {
      target: { value: 'false' },
    });
    expect(onFilterChange).toHaveBeenCalledWith(
      expect.objectContaining({ is_completed: false }),
    );
  });

  it('완료 여부 "완료" 선택 시 is_completed: true', () => {
    const onFilterChange = jest.fn();
    renderFilterBar({}, onFilterChange);
    fireEvent.change(screen.getByLabelText('완료 여부 필터'), {
      target: { value: 'true' },
    });
    expect(onFilterChange).toHaveBeenCalledWith(
      expect.objectContaining({ is_completed: true }),
    );
  });

  it('카테고리 선택 시 category_id 포함', () => {
    const onFilterChange = jest.fn();
    renderFilterBar({}, onFilterChange);
    fireEvent.change(screen.getByLabelText('카테고리 필터'), {
      target: { value: 'cat-1' },
    });
    expect(onFilterChange).toHaveBeenCalledWith(
      expect.objectContaining({ category_id: 'cat-1' }),
    );
  });

  it('마감일 시작 입력 시 onFilterChange 호출', () => {
    const onFilterChange = jest.fn();
    renderFilterBar({}, onFilterChange);
    fireEvent.change(screen.getByLabelText('마감일 시작'), {
      target: { value: '2026-06-02' },
    });
    expect(onFilterChange).toHaveBeenCalledWith(
      expect.objectContaining({ due_date_from: '2026-06-02' }),
    );
  });

  it('마감일 종료 입력 시 onFilterChange 호출', () => {
    const onFilterChange = jest.fn();
    renderFilterBar({}, onFilterChange);
    fireEvent.change(screen.getByLabelText('마감일 종료'), {
      target: { value: '2026-06-08' },
    });
    expect(onFilterChange).toHaveBeenCalledWith(
      expect.objectContaining({ due_date_to: '2026-06-08' }),
    );
  });

  it('이번 주 버튼 클릭 시 due_date_from, due_date_to 설정', () => {
    const onFilterChange = jest.fn();
    renderFilterBar({}, onFilterChange);
    fireEvent.click(screen.getByText('이번 주'));
    const called = onFilterChange.mock.calls[0][0] as SearchFilters;
    expect(called.due_date_from).toBeDefined();
    expect(called.due_date_to).toBeDefined();
    expect(called.due_date_from!.match(/^\d{4}-\d{2}-\d{2}$/)).toBeTruthy();
  });

  it('현재 filters 값이 select에 반영된다', () => {
    renderFilterBar({ priority: 'medium' });
    const select = screen.getByLabelText('우선순위 필터') as HTMLSelectElement;
    expect(select.value).toBe('medium');
  });
});
