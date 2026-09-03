import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

const PUBLIC_ROUTES = ['/login', '/gerencia/setup'];

const STAFF_ROUTES: Record<string, string[]> = {
  '/garcom': ['garcom', 'gerencia'],
  '/balcao': ['balcao', 'gerencia'],
  '/gerencia': ['gerencia'],
};

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const pathname = request.nextUrl.pathname;

  if (PUBLIC_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`))) {
    return supabaseResponse;
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  for (const [routePrefix, allowedRoles] of Object.entries(STAFF_ROUTES)) {
    if (pathname.startsWith(routePrefix)) {
      if (!user) {
        const url = request.nextUrl.clone();
        url.pathname = '/login';
        url.searchParams.set('redirect', pathname);
        return NextResponse.redirect(url);
      }

      const { data: systemUser } = await supabase
        .from('system_users')
        .select('role, active')
        .eq('auth_user_id', user.id)
        .single();

      if (!systemUser?.active || !allowedRoles.includes(systemUser.role)) {
        const url = request.nextUrl.clone();
        url.pathname = '/login';
        url.searchParams.set('error', 'unauthorized');
        return NextResponse.redirect(url);
      }
    }
  }

  if (pathname === '/login' && user) {
    const { data: systemUser } = await supabase
      .from('system_users')
      .select('role')
      .eq('auth_user_id', user.id)
      .single();

    if (systemUser) {
      const redirectMap: Record<string, string> = {
        garcom: '/garcom',
        balcao: '/balcao',
        gerencia: '/gerencia',
      };
      const url = request.nextUrl.clone();
      url.pathname = redirectMap[systemUser.role] || '/';
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
