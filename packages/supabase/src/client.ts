import { createClient, type SupabaseClient, type SupabaseClientOptions } from '@supabase/supabase-js';

export interface SupabaseEnv {
  url: string;
  anonKey: string;
  // Optional storage adapter — RN provides AsyncStorage, browsers default to localStorage.
  storage?: SupabaseClientOptions<'public'>['auth']['storage'];
}

let cached: SupabaseClient | null = null;

// Recognize refresh / jwt failures so we can silently log the user out instead of
// repeatedly throwing `Invalid Refresh Token`. Happens after the auth server is
// re-seeded (our demo user script wipes & recreates) or a signed-out session
// lingers in AsyncStorage/localStorage.
function isStaleAuthError(err: unknown): boolean {
  const msg = (err as { message?: string } | null)?.message?.toLowerCase() ?? '';
  return (
    msg.includes('refresh token not found') ||
    msg.includes('invalid refresh token') ||
    msg.includes('refresh_token_not_found') ||
    msg.includes('jwt expired')
  );
}

export function createMingaClient(env: SupabaseEnv): SupabaseClient {
  if (!env.url || !env.anonKey) {
    throw new Error('Supabase env missing — ensure SUPABASE_URL and SUPABASE_ANON_KEY are set');
  }
  const client = createClient(env.url, env.anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: typeof window !== 'undefined',
      storage: env.storage,
    },
    global: {
      headers: { 'x-minga-client': 'web' },
    },
  });

  // On boot: if the stored session references a user/token the server no
  // longer recognizes, wipe the local session quietly so the app falls back
  // to the signed-out UI instead of spamming console errors.
  void (async () => {
    try {
      const { error } = await client.auth.getSession();
      if (error && isStaleAuthError(error)) {
        await client.auth.signOut({ scope: 'local' });
      }
    } catch (e) {
      if (isStaleAuthError(e)) {
        await client.auth.signOut({ scope: 'local' }).catch(() => undefined);
      }
    }
  })();

  // Also clear on the background auto-refresh failure (SDK fires SIGNED_OUT
  // when it gives up). Belt-and-suspenders because some refresh paths swallow
  // the error before it reaches the caller.
  client.auth.onAuthStateChange((event) => {
    if (event === 'SIGNED_OUT') {
      // no-op — Supabase already cleared. Hook exists so consumers can subscribe
      // downstream without re-implementing the stale-session reset.
    }
  });

  return client;
}

// Convenience singleton factory — each app calls initSupabase once with its own env adapters.
export function initSupabase(env: SupabaseEnv): SupabaseClient {
  if (!cached) cached = createMingaClient(env);
  return cached;
}

export function getSupabase(): SupabaseClient {
  if (!cached) throw new Error('Supabase not initialized — call initSupabase(env) first');
  return cached;
}

export { isStaleAuthError };
