import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch (error) {
            // Server Component contexts expose a read-only cookies() store.
            // Token-refresh writes silently fail here; the session remains
            // readable via getAll() so the current request still succeeds.
            // Log anything other than the expected read-only error so it surfaces.
            if (
              !(error instanceof Error) ||
              !error.message.includes('Cookies can only be modified')
            ) {
              console.error('[supabase/server] unexpected setAll error:', error);
            }
          }
        },
      },
    },
  );
}
