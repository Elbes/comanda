import { createBrowserClient } from '@supabase/ssr';

export function createClient(sessionToken?: string) {
  const globalHeaders: Record<string, string> = {};
  if (sessionToken) {
    globalHeaders['x-comanda-session'] = sessionToken;
  }

  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: globalHeaders,
      },
    }
  );
}
