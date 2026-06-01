import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import FilterTags from './FilterTags';
import type { CategoryItem, SearchFilters } from '@/types/filters';

const categories: CategoryItem[] = [
  { id: 'cat-1', name: '업무' },
  { id: 'cat-2', name: '개인' },
];

function renderFilterTags(filters: SearchFilters, onRemove = jest.fn()) {
  return render(
    <FilterTags filters={filters} categories={categories} onRemove={onRemove} />,
  );
}

describe('FilterTags', () => {
  it('빈 filters이면 아무것도 렌더링되지 않는다', () => {
    const { container } = renderFilterTags({});
    expect(container.firstChild).toBeNull();
  });

  it('priority 필터 적용 시 태그 렌더링', () => {
    renderFilterTags({ priority: 'high' });
    expect(screen.getByText('높은 우선순위')).toBeInTheDocument();
  });

  it('priority medium 태그 레이블', () => {
    renderFilterTags({ priority: 'medium' });
    expect(screen.getByText('중간 우선순위')).toBeInTheDocument();
  });

  it('priority low 태그 레이블', () => {
    renderFilterTags({ priority: 'low' });
    expect(screen.getByText('낮은 우선순위')).toBeInTheDocument();
  });

  it('is_completed: false 태그 — "미완료"', () => {
    renderFilterTags({ is_completed: false });
    expect(screen.getByText('미완료')).toBeInTheDocument();
  });

  it('is_completed: true 태그 — "완료"', () => {
    renderFilterTags({ is_completed: true });
    expect(screen.getByText('완료')).toBeInTheDocument();
  });

  it('category_id 필터 태그 — 카테고리 이름 표시', () => {
    renderFilterTags({ category_id: 'cat-1' });
    expect(screen.getByText('카테고리: 업무')).toBeInTheDocument();
  });

  it('due_date_from 태그 표시', () => {
    renderFilterTags({ due_date_from: '2026-06-02' });
    expect(screen.getByText('마감 시작: 2026-06-02')).toBeInTheDocument();
  });

  it('due_date_to 태그 표시', () => {
    renderFilterTags({ due_date_to: '2026-06-08' });
    expect(screen.getByText('마감 종료: 2026-06-08')).toBeInTheDocument();
  });

  it('복수 필터 적용 시 여러 태그 렌더링', () => {
    renderFilterTags({ priority: 'high', is_completed: false, category_id: 'cat-1' });
    expect(screen.getByText('높은 우선순위')).toBeInTheDocument();
    expect(screen.getByText('미완료')).toBeInTheDocument();
    expect(screen.getByText('카테고리: 업무')).toBeInTheDocument();
  });

  it('priority 태그 삭제 버튼 클릭 시 onRemove("priority") 호출', () => {
    const onRemove = jest.fn();
    renderFilterTags({ priority: 'high' }, onRemove);
    fireEvent.click(screen.getByLabelText('높은 우선순위 필터 제거'));
    expect(onRemove).toHaveBeenCalledWith('priority');
  });

  it('is_completed 태그 삭제 버튼 클릭 시 onRemove("is_completed") 호출', () => {
    const onRemove = jest.fn();
    renderFilterTags({ is_completed: true }, onRemove);
    fireEvent.click(screen.getByLabelText('완료 필터 제거'));
    expect(onRemove).toHaveBeenCalledWith('is_completed');
  });

  it('category 태그 삭제 시 onRemove("category_id") 호출', () => {
    const onRemove = jest.fn();
    renderFilterTags({ category_id: 'cat-2' }, onRemove);
    fireEvent.click(screen.getByLabelText('카테고리: 개인 필터 제거'));
    expect(onRemove).toHaveBeenCalledWith('category_id');
  });

  it('aria-label "적용된 필터" 컨테이너가 존재한다', () => {
    renderFilterTags({ priority: 'low' });
    expect(screen.getByLabelText('적용된 필터')).toBeInTheDocument();
  });
});
