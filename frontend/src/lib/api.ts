import { createClient } from '@/lib/supabase/client';
import type { DashboardResponse, TodoDashboardItem } from '@/types/dashboard';

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

export async function searchTodos(q: string): Promise<TodoDashboardItem[]> {
  const token = await getAccessToken();
  const url = q
    ? `${process.env.NEXT_PUBLIC_API_URL}/todos/search?q=${encodeURIComponent(q)}`
    : `${process.env.NEXT_PUBLIC_API_URL}/todos/search`;

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
