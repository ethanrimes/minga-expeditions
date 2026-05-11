import { cookies } from 'next/headers';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { createClient as createPlainClient } from '@supabase/supabase-js';
import { env } from '../env';

// Server-side Supabase client that reads/writes the user's session cookies.
// Use this in Server Components, Route Handlers, and Server Actions.
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  return createServerClient(env.supabaseUrl(), env.supabaseAnonKey(), {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(toSet: { name: string; value: string; options: CookieOptions }[]) {
        try {
          for (const { name, value, options } of toSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // setAll throws when called from a Server Component (read-only).
          // Safe to ignore — middleware refreshes cookies on the next request.
        }
      },
    },
  });
}

// Service-role client for the rare admin operation that has to bypass RLS
// (e.g. promoting another user to admin). NEVER pass this to a client
// component; keep all calls server-side.
export function createSupabaseServiceClient() {
  return createPlainClient(env.supabaseUrl(), env.supabaseServiceRoleKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
