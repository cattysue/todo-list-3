import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import TodoForm from './TodoForm';
import * as useCreateTodoHook from '@/hooks/useCreateTodo';
import * as useUpdateTodoHook from '@/hooks/useUpdateTodo';
import * as useCategoriesHook from '@/hooks/useCategories';
import type { TodoItem } from '@/types/todos';

jest.mock('@/hooks/useCreateTodo');
jest.mock('@/hooks/useUpdateTodo');
jest.mock('@/hooks/useCategories');

const mockCategories = [
  { id: 'cat-1', name: '업무' },
  { id: 'cat-2', name: '개인' },
];

const mockTodoItem: TodoItem = {
  id: 'todo-1',
  title: '기존 할일',
  due_date: '2026-06-10',
  priority: 'high',
  is_completed: false,
  created_at: null,
  category_id: 'cat-1',
  category_name: '업무',
  recurrence_type: 'weekly',
  recurrence_days: '0,2',
  recurrence_day_of_month: null,
};

function setupMocks(mutateFn = jest.fn()) {
  const mockMutate = mutateFn;
  (useCreateTodoHook.useCreateTodo as jest.Mock).mockReturnValue({
    mutate: mockMutate,
    isPending: false,
  });
  (useUpdateTodoHook.useUpdateTodo as jest.Mock).mockReturnValue({
    mutate: mockMutate,
    isPending: false,
  });
  (useCategoriesHook.useCategories as jest.Mock).mockReturnValue({
    data: mockCategories,
  });
  return mockMutate;
}

function renderForm(props: Partial<React.ComponentProps<typeof TodoForm>> = {}) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    React.createElement(
      QueryClientProvider,
      { client: queryClient },
      React.createElement(TodoForm, {
        onSuccess: jest.fn(),
        onCancel: jest.fn(),
        ...props,
      }),
    ),
  );
}

describe('TodoForm — 반복 없음 (기본 상태)', () => {
  beforeEach(() => setupMocks());

  it('제목 입력 필드가 렌더링된다', () => {
    renderForm();
    expect(screen.getByPlaceholderText('할일 제목을 입력하세요')).toBeInTheDocument();
  });

  it('"반복 없음" 버튼이 기본 선택 상태', () => {
    renderForm();
    const noneBtn = screen.getByText('반복 없음');
    expect(noneBtn).toHaveClass('bg-blue-600');
  });

  it('요일 버튼이 표시되지 않는다', () => {
    renderForm();
    expect(screen.queryByText('월')).not.toBeInTheDocument();
  });

  it('날짜 입력이 표시되지 않는다', () => {
    renderForm();
    expect(screen.queryByText('매월 몇 일?')).not.toBeInTheDocument();
  });

  it('카테고리 목록이 표시된다', () => {
    renderForm();
    expect(screen.getByText('업무')).toBeInTheDocument();
    expect(screen.getByText('개인')).toBeInTheDocument();
  });

  it('우선순위 select가 렌더링된다', () => {
    renderForm();
    expect(screen.getByText('높음')).toBeInTheDocument();
  });
});

describe('TodoForm — 매일 반복', () => {
  beforeEach(() => setupMocks());

  it('매일 버튼 클릭 시 요일/날짜 UI가 표시되지 않는다', () => {
    renderForm();
    fireEvent.click(screen.getByText('매일'));
    expect(screen.queryByText('월')).not.toBeInTheDocument();
    expect(screen.queryByText('매월 몇 일?')).not.toBeInTheDocument();
  });

  it('매일 버튼 클릭 후 활성 상태', () => {
    renderForm();
    const dailyBtn = screen.getByText('매일');
    fireEvent.click(dailyBtn);
    expect(dailyBtn).toHaveClass('bg-blue-600');
  });
});

describe('TodoForm — 매주 반복', () => {
  beforeEach(() => setupMocks());

  it('매주 버튼 클릭 시 요일 버튼이 표시된다', () => {
    renderForm();
    fireEvent.click(screen.getByText('매주'));
    expect(screen.getByText('월')).toBeInTheDocument();
    expect(screen.getByText('화')).toBeInTheDocument();
    expect(screen.getByText('수')).toBeInTheDocument();
    expect(screen.getByText('목')).toBeInTheDocument();
    expect(screen.getByText('금')).toBeInTheDocument();
    expect(screen.getByText('토')).toBeInTheDocument();
    expect(screen.getByText('일')).toBeInTheDocument();
  });

  it('요일 버튼 토글 — 선택/해제', () => {
    renderForm();
    fireEvent.click(screen.getByText('매주'));
    const monBtn = screen.getByText('월');
    expect(monBtn).not.toHaveClass('bg-blue-600');
    fireEvent.click(monBtn);
    expect(monBtn).toHaveClass('bg-blue-600');
    fireEvent.click(monBtn);
    expect(monBtn).not.toHaveClass('bg-blue-600');
  });

  it('요일 미선택 시 오류 메시지 표시', () => {
    renderForm();
    fireEvent.click(screen.getByText('매주'));
    fireEvent.change(screen.getByPlaceholderText('할일 제목을 입력하세요'), {
      target: { value: '운동하기' },
    });
    fireEvent.click(screen.getByText('저장'));
    expect(screen.getByText('매주 반복 시 요일을 최소 1개 선택해 주세요.')).toBeInTheDocument();
  });
});

describe('TodoForm — 매월 반복', () => {
  beforeEach(() => setupMocks());

  it('매월 버튼 클릭 시 날짜 입력이 표시된다', () => {
    renderForm();
    fireEvent.click(screen.getByText('매월'));
    expect(screen.getByText('매월 몇 일?')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('1~31')).toBeInTheDocument();
  });

  it('날짜 미입력 시 오류 메시지 표시', () => {
    renderForm();
    fireEvent.click(screen.getByText('매월'));
    fireEvent.change(screen.getByPlaceholderText('할일 제목을 입력하세요'), {
      target: { value: '정산하기' },
    });
    fireEvent.click(screen.getByText('저장'));
    expect(
      screen.getByText('매월 반복 시 1~31 사이의 날짜를 입력해 주세요.'),
    ).toBeInTheDocument();
  });

  it('범위 외 날짜(32) 입력 시 오류 표시', () => {
    renderForm();
    fireEvent.click(screen.getByText('매월'));
    fireEvent.change(screen.getByPlaceholderText('할일 제목을 입력하세요'), {
      target: { value: '정산하기' },
    });
    fireEvent.change(screen.getByPlaceholderText('1~31'), {
      target: { value: '32' },
    });
    fireEvent.click(screen.getByText('저장'));
    expect(
      screen.getByText('매월 반복 시 1~31 사이의 날짜를 입력해 주세요.'),
    ).toBeInTheDocument();
  });
});

describe('TodoForm — 제목 검증', () => {
  beforeEach(() => setupMocks());

  it('제목 없이 제출 시 오류 메시지 표시', () => {
    renderForm();
    fireEvent.click(screen.getByText('저장'));
    expect(screen.getByText('제목을 입력해 주세요.')).toBeInTheDocument();
  });
});

describe('TodoForm — 생성 모드 (initialData 없음)', () => {
  it('제목 입력 후 저장 시 useCreateTodo.mutate 호출', () => {
    const mutateFn = jest.fn();
    setupMocks(mutateFn);
    renderForm();

    fireEvent.change(screen.getByPlaceholderText('할일 제목을 입력하세요'), {
      target: { value: '새 할일' },
    });
    fireEvent.click(screen.getByText('저장'));

    expect(mutateFn).toHaveBeenCalledTimes(1);
    const [payload] = mutateFn.mock.calls[0];
    expect(payload.title).toBe('새 할일');
    expect(payload.recurrence_type).toBeUndefined();
  });

  it('매주 반복 + 요일 선택 후 저장 시 recurrence_days 포함', () => {
    const mutateFn = jest.fn();
    setupMocks(mutateFn);
    renderForm();

    fireEvent.change(screen.getByPlaceholderText('할일 제목을 입력하세요'), {
      target: { value: '운동하기' },
    });
    fireEvent.click(screen.getByText('매주'));
    fireEvent.click(screen.getByText('월'));
    fireEvent.click(screen.getByText('수'));
    fireEvent.click(screen.getByText('저장'));

    const [payload] = mutateFn.mock.calls[0];
    expect(payload.recurrence_type).toBe('weekly');
    expect(payload.recurrence_days).toBe('0,2');
  });

  it('매월 반복 + 날짜 15 저장 시 recurrence_day_of_month 포함', () => {
    const mutateFn = jest.fn();
    setupMocks(mutateFn);
    renderForm();

    fireEvent.change(screen.getByPlaceholderText('할일 제목을 입력하세요'), {
      target: { value: '정산하기' },
    });
    fireEvent.click(screen.getByText('매월'));
    fireEvent.change(screen.getByPlaceholderText('1~31'), {
      target: { value: '15' },
    });
    fireEvent.click(screen.getByText('저장'));

    const [payload] = mutateFn.mock.calls[0];
    expect(payload.recurrence_type).toBe('monthly');
    expect(payload.recurrence_day_of_month).toBe(15);
  });
});

describe('TodoForm — 수정 모드 (initialData 있음)', () => {
  it('initialData가 있으면 "할일 수정" 타이틀 표시', () => {
    setupMocks();
    renderForm({ initialData: mockTodoItem });
    expect(screen.getByText('할일 수정')).toBeInTheDocument();
  });

  it('initialData 제목이 초기값으로 설정된다', () => {
    setupMocks();
    renderForm({ initialData: mockTodoItem });
    const input = screen.getByPlaceholderText('할일 제목을 입력하세요') as HTMLInputElement;
    expect(input.value).toBe('기존 할일');
  });

  it('수정 모드에서 저장 시 useUpdateTodo.mutate 호출', () => {
    const mutateFn = jest.fn();
    (useCreateTodoHook.useCreateTodo as jest.Mock).mockReturnValue({
      mutate: jest.fn(),
      isPending: false,
    });
    (useUpdateTodoHook.useUpdateTodo as jest.Mock).mockReturnValue({
      mutate: mutateFn,
      isPending: false,
    });
    (useCategoriesHook.useCategories as jest.Mock).mockReturnValue({
      data: mockCategories,
    });

    renderForm({ initialData: mockTodoItem });
    fireEvent.click(screen.getAllByText('월')[0]);
    fireEvent.click(screen.getByText('저장'));

    expect(mutateFn).toHaveBeenCalledTimes(1);
    const [{ id }] = mutateFn.mock.calls[0];
    expect(id).toBe('todo-1');
  });
});
