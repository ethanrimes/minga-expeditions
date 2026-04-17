import { createClient, type SupabaseClient, type SupabaseClientOptions } from '@supabase/supabase-js';

export interface SupabaseEnv {
  url: string;
  anonKey: string;
  // Optional storage adapter — RN provides AsyncStorage, browsers default to localStorage.
  storage?: SupabaseClientOptions<'public'>['auth']['storage'];
  // Opt out of automatic anonymous sign-in (true by default). If the Supabase
  // project has `Allow anonymous sign-ins` disabled, the call fails silently.
  autoAnonymous?: boolean;
}

let cached: SupabaseClient | null = null;

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

  // Boot-time auth housekeeping:
  //   1. If the stored session is stale (user re-seeded, key rotated, etc.)
  //      sign out silently so the UI lands on a fresh state instead of
  //      spamming "Invalid Refresh Token".
  //   2. If there's no session at all and the caller hasn't opted out, try
  //      `signInAnonymously()` so every visitor gets a session and can like,
  //      comment, rate, and track activities without a sign-up flow. Fails
  //      silently if the project has anonymous sign-ins disabled — in that
  //      case the user simply sees the sign-in prompts they had before.
  const autoAnon = env.autoAnonymous !== false;
  void (async () => {
    try {
      const { data, error } = await client.auth.getSession();
      if (error && isStaleAuthError(error)) {
        await client.auth.signOut({ scope: 'local' }).catch(() => undefined);
      }
      if (autoAnon && !data?.session) {
        // supabase-js >= 2.43 ships `signInAnonymously`. If the user is on an
        // older version, the method is missing; guard so we don't crash.
        const anon = (client.auth as unknown as {
          signInAnonymously?: () => Promise<{ error: unknown }>;
        }).signInAnonymously;
        if (typeof anon === 'function') {
          try {
            await anon.call(client.auth);
          } catch {
            /* feature disabled on the project — leave session null */
          }
        }
      }
    } catch (e) {
      if (isStaleAuthError(e)) {
        await client.auth.signOut({ scope: 'local' }).catch(() => undefined);
      }
    }
  })();

  client.auth.onAuthStateChange((event) => {
    if (event === 'SIGNED_OUT') {
      // no-op — hook exists so downstream consumers can subscribe without
      // re-implementing the stale-session reset.
    }
  });

  return client;
}

export function initSupabase(env: SupabaseEnv): SupabaseClient {
  if (!cached) cached = createMingaClient(env);
  return cached;
}

export function getSupabase(): SupabaseClient {
  if (!cached) throw new Error('Supabase not initialized — call initSupabase(env) first');
  return cached;
}

export { isStaleAuthError };
