import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { SESSION_COOKIE_NAME } from '@/lib/utils/constants';

export async function createClient() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  const globalHeaders: Record<string, string> = {};
  if (sessionToken) {
    globalHeaders['x-comanda-session'] = sessionToken;
  }

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server Component — ignorar
          }
        },
      },
      global: {
        headers: globalHeaders,
      },
    }
  );
}
