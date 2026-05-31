/**
 * middleware.ts의 리다이렉트 로직 단위 테스트
 * Next.js middleware는 Edge Runtime에서 실행되므로
 * 리다이렉트 결정 로직만 추출하여 테스트한다.
 */

type User = { id: string } | null;

function resolveRedirect(pathname: string, user: User): string | null {
  if (pathname === '/' && user) return '/dashboard';
  if ((pathname === '/' || pathname.startsWith('/dashboard')) && !user)
    return '/login';
  return null;
}

describe('미들웨어 리다이렉트 로직', () => {
  it('로그인 상태에서 "/" 접근 시 "/dashboard"로 리다이렉트', () => {
    expect(resolveRedirect('/', { id: 'user-1' })).toBe('/dashboard');
  });

  it('미로그인 상태에서 "/" 접근 시 "/login"으로 리다이렉트', () => {
    expect(resolveRedirect('/', null)).toBe('/login');
  });

  it('미로그인 상태에서 "/dashboard" 직접 접근 시 "/login"으로 리다이렉트', () => {
    expect(resolveRedirect('/dashboard', null)).toBe('/login');
  });

  it('로그인 상태에서 "/dashboard" 접근 시 리다이렉트하지 않는다', () => {
    expect(resolveRedirect('/dashboard', { id: 'user-1' })).toBeNull();
  });

  it('다른 경로는 리다이렉트하지 않는다', () => {
    expect(resolveRedirect('/login', null)).toBeNull();
    expect(resolveRedirect('/categories', { id: 'user-1' })).toBeNull();
  });
});
