import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import TodoModal from './TodoModal';
import * as useCreateTodoHook from '@/hooks/useCreateTodo';
import * as useUpdateTodoHook from '@/hooks/useUpdateTodo';
import * as useCategoriesHook from '@/hooks/useCategories';

jest.mock('@/hooks/useCreateTodo');
jest.mock('@/hooks/useUpdateTodo');
jest.mock('@/hooks/useCategories');

function setupMocks() {
  (useCreateTodoHook.useCreateTodo as jest.Mock).mockReturnValue({
    mutate: jest.fn(),
    isPending: false,
  });
  (useUpdateTodoHook.useUpdateTodo as jest.Mock).mockReturnValue({
    mutate: jest.fn(),
    isPending: false,
  });
  (useCategoriesHook.useCategories as jest.Mock).mockReturnValue({
    data: [],
  });
}

function renderModal(isOpen: boolean, onClose = jest.fn()) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    React.createElement(
      QueryClientProvider,
      { client: queryClient },
      React.createElement(TodoModal, { isOpen, onClose }),
    ),
  );
}

describe('TodoModal', () => {
  beforeEach(() => setupMocks());

  it('isOpen=false 이면 아무것도 렌더링되지 않는다', () => {
    renderModal(false);
    expect(screen.queryByText('할일 추가')).not.toBeInTheDocument();
  });

  it('isOpen=true 이면 TodoForm이 렌더링된다', () => {
    renderModal(true);
    expect(screen.getByText('할일 추가')).toBeInTheDocument();
  });

  it('배경 클릭 시 onClose 호출', () => {
    const onClose = jest.fn();
    renderModal(true, onClose);
    // backdrop은 첫 번째 fixed div
    const backdrop = document.querySelector('.fixed.inset-0') as HTMLElement;
    fireEvent.click(backdrop);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('폼 영역 클릭은 onClose 호출하지 않음', () => {
    const onClose = jest.fn();
    renderModal(true, onClose);
    const formCard = document.querySelector('.bg-white.rounded-lg') as HTMLElement;
    fireEvent.click(formCard);
    expect(onClose).not.toHaveBeenCalled();
  });

  it('ESC 키 입력 시 onClose 호출', () => {
    const onClose = jest.fn();
    renderModal(true, onClose);
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
