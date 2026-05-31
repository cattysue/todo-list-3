import { createClient } from '@/lib/supabase/client';
import type { DashboardResponse } from '@/types/dashboard';

export async function getDashboardTodos(): Promise<DashboardResponse> {
  const supabase = createClient();

  // getUser() validates the JWT with Supabase's auth server (not just local storage)
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('인증이 필요합니다.');
  }

  // getSession() provides the access_token to forward to the backend
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error('인증이 필요합니다.');
  }

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/todos/dashboard`,
    {
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
    },
  );

  if (!res.ok) {
    throw new Error(`API 오류: ${res.status}`);
  }

  return res.json() as Promise<DashboardResponse>;
}
