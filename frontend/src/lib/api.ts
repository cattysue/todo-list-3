import { createClient } from '@/lib/supabase/client';
import type { DashboardResponse, TodoDashboardItem } from '@/types/dashboard';
import type { CategoryItem, SearchFilters } from '@/types/filters';
import type { Template, CreateTemplateRequest, ApplyTemplateRequest } from '@/types/templates';
import type { TodoItem, CreateTodoRequest, UpdateTodoRequest } from '@/types/todos';
import type { TodoCalendarItem } from '@/types/calendar';
import type { CompletionStatsResponse, StatsPeriod } from '@/types/stats';

async function getAccessToken(): Promise<string> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('인증이 필요합니다.');
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error('인증이 필요합니다.');
  }

  return session.access_token;
}

export async function getDashboardTodos(): Promise<DashboardResponse> {
  const token = await getAccessToken();

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/todos/dashboard`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    },
  );

  if (!res.ok) {
    throw new Error(`API 오류: ${res.status}`);
  }

  return res.json() as Promise<DashboardResponse>;
}

export async function completeTodo(todoId: string): Promise<void> {
  const token = await getAccessToken();

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/todos/${todoId}`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ is_completed: true }),
    },
  );

  if (!res.ok) {
    throw new Error(`완료 처리 오류: ${res.status}`);
  }
}

export async function searchTodos(
  q: string,
  filters?: SearchFilters,
): Promise<TodoDashboardItem[]> {
  const token = await getAccessToken();

  const params = new URLSearchParams();
  if (q) params.set('q', q);
  if (filters?.priority) params.set('priority', filters.priority);
  if (filters?.due_date_from) params.set('due_date_from', filters.due_date_from);
  if (filters?.due_date_to) params.set('due_date_to', filters.due_date_to);
  if (filters?.is_completed !== undefined)
    params.set('is_completed', String(filters.is_completed));
  if (filters?.category_id) params.set('category_id', filters.category_id);

  const queryStr = params.toString();
  const url = `${process.env.NEXT_PUBLIC_API_URL}/todos/search${queryStr ? `?${queryStr}` : ''}`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    throw new Error(`검색 오류: ${res.status}`);
  }

  return res.json() as Promise<TodoDashboardItem[]>;
}

export async function getCategories(): Promise<CategoryItem[]> {
  const token = await getAccessToken();

  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/categories`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    throw new Error(`카테고리 로드 오류: ${res.status}`);
  }

  return res.json() as Promise<CategoryItem[]>;
}

export async function createTodo(data: CreateTodoRequest): Promise<TodoItem> {
  const token = await getAccessToken();

  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/todos`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    throw new Error(`할일 생성 오류: ${res.status}`);
  }

  return res.json() as Promise<TodoItem>;
}

export async function getTodo(id: string): Promise<TodoItem> {
  const token = await getAccessToken();

  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/todos/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    throw new Error(`할일 조회 오류: ${res.status}`);
  }

  return res.json() as Promise<TodoItem>;
}

export type RecurrenceAction = 'skip' | 'pause' | 'resume' | 'end';

export async function controlRecurrence(
  todoId: string,
  action: RecurrenceAction,
): Promise<void> {
  const token = await getAccessToken();

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/todos/${todoId}/recurrence`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action }),
    },
  );

  if (!res.ok) {
    throw new Error(`반복 제어 오류: ${res.status}`);
  }
}

export async function updateTodo(
  id: string,
  data: UpdateTodoRequest,
): Promise<TodoItem> {
  const token = await getAccessToken();

  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/todos/${id}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    throw new Error(`할일 수정 오류: ${res.status}`);
  }

  return res.json() as Promise<TodoItem>;
}

export async function getTemplates(): Promise<Template[]> {
  const token = await getAccessToken();
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/templates`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`템플릿 조회 오류: ${res.status}`);
  return res.json() as Promise<Template[]>;
}

export async function createTemplate(data: CreateTemplateRequest): Promise<Template> {
  const token = await getAccessToken();
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/templates`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`템플릿 생성 오류: ${res.status}`);
  return res.json() as Promise<Template>;
}

export async function deleteTemplate(templateId: string): Promise<void> {
  const token = await getAccessToken();
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/templates/${templateId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`템플릿 삭제 오류: ${res.status}`);
}

export async function applyTemplate(
  templateId: string,
  data: ApplyTemplateRequest,
): Promise<TodoItem[]> {
  const token = await getAccessToken();
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/templates/${templateId}/apply`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    },
  );
  if (!res.ok) throw new Error(`템플릿 적용 오류: ${res.status}`);
  return res.json() as Promise<TodoItem[]>;
}

export async function getCompletionStats(
  period: StatsPeriod,
  count: number,
): Promise<CompletionStatsResponse> {
  const token = await getAccessToken();
  const params = new URLSearchParams({ period, count: String(count) });
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/stats/completion?${params.toString()}`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (!res.ok) throw new Error(`통계 조회 오류: ${res.status}`);
  return res.json() as Promise<CompletionStatsResponse>;
}

export async function getCalendarTodos(
  start: string,
  end: string,
): Promise<TodoCalendarItem[]> {
  const token = await getAccessToken();
  const params = new URLSearchParams({ start, end });
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/todos/calendar?${params.toString()}`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (!res.ok) throw new Error(`캘린더 조회 오류: ${res.status}`);
  return res.json() as Promise<TodoCalendarItem[]>;
}
