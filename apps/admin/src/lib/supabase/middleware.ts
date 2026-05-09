import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { env } from '../env';

// Refreshes the Supabase session on every request and forwards updated cookies
// to the response. Without this, expired tokens never auto-refresh and the
// admin gets booted out of the dashboard mid-session.
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(env.supabaseUrl(), env.supabaseAnonKey(), {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(toSet) {
        for (const { name, value } of toSet) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of toSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  // Touching getUser() forces the SDK to refresh if the session is near expiry.
  await supabase.auth.getUser();

  return response;
}
