import { getDashboardTodos } from './api';

jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(),
}));

const { createClient } = require('@/lib/supabase/client');

const mockDashboardResponse = {
  overdue: [],
  today: [
    {
      id: 'uuid-1',
      title: '오늘 할 일',
      due_date: '2026-06-01',
      priority: 'high',
      is_completed: false,
      created_at: '2026-05-01T00:00:00Z',
      category_id: 'cat-1',
      category_name: '업무',
    },
  ],
  tomorrow: [],
  this_week: [],
};

function mockAuthClient({
  user = { id: 'user-1' },
  accessToken = 'mock-token',
}: {
  user?: { id: string } | null;
  accessToken?: string | null;
} = {}) {
  createClient.mockReturnValue({
    auth: {
      getUser: jest.fn().mockResolvedValue({ data: { user } }),
      getSession: jest.fn().mockResolvedValue({
        data: { session: accessToken ? { access_token: accessToken } : null },
      }),
    },
  });
}

describe('getDashboardTodos', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv, NEXT_PUBLIC_API_URL: 'http://localhost:8000' };
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.resetAllMocks();
  });

  it('getUser()가 null을 반환하면 에러를 던진다 (서버 미검증 세션)', async () => {
    mockAuthClient({ user: null });
    await expect(getDashboardTodos()).rejects.toThrow('인증이 필요합니다.');
  });

  it('getUser() 통과 후 session이 없으면 에러를 던진다', async () => {
    mockAuthClient({ accessToken: null });
    await expect(getDashboardTodos()).rejects.toThrow('인증이 필요합니다.');
  });

  it('API 호출 성공 시 DashboardResponse를 반환한다', async () => {
    mockAuthClient();
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue(mockDashboardResponse),
    } as unknown as Response);

    const result = await getDashboardTodos();
    expect(result).toEqual(mockDashboardResponse);
  });

  it('API 호출 시 Authorization Bearer 헤더를 포함한다', async () => {
    mockAuthClient({ accessToken: 'test-token-abc' });
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue(mockDashboardResponse),
    } as unknown as Response);

    await getDashboardTodos();

    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:8000/todos/dashboard',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer test-token-abc',
        }),
      }),
    );
  });

  it('API 응답이 ok가 아니면 에러를 던진다', async () => {
    mockAuthClient();
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 401,
    } as unknown as Response);

    await expect(getDashboardTodos()).rejects.toThrow('API 오류: 401');
  });
});
