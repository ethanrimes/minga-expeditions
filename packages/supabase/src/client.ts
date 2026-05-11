import { createClient, type SupabaseClient, type SupabaseClientOptions } from '@supabase/supabase-js';

type AuthOptions = NonNullable<SupabaseClientOptions<'public'>['auth']>;

export interface SupabaseEnv {
  url: string;
  anonKey: string;
  // Optional storage adapter — RN provides AsyncStorage, browsers default to localStorage.
  storage?: AuthOptions['storage'];
  // Opt out of automatic anonymous sign-in (true by default). If the Supabase
  // project has `Allow anonymous sign-ins` disabled, the call fails silently.
  autoAnonymous?: boolean;
}

let cached: SupabaseClient | null = null;

// Cached across reloads: once the Supabase project tells us anonymous
// sign-ins are disabled, don't keep hitting /auth/v1/signup every page
// load (it just produces 422s in the network panel).
const ANON_DISABLED_KEY = 'minga.anon-disabled';

function isStaleAuthError(err: unknown): boolean {
  const msg = (err as { message?: string } | null)?.message?.toLowerCase() ?? '';
  return (
    msg.includes('refresh token not found') ||
    msg.includes('invalid refresh token') ||
    msg.includes('refresh_token_not_found') ||
    msg.includes('jwt expired')
  );
}

function isAnonDisabledError(err: unknown): boolean {
  const e = err as { status?: number; message?: string; code?: string } | null;
  const msg = (e?.message ?? '').toLowerCase();
  return (
    e?.status === 422 ||
    e?.code === 'anonymous_provider_disabled' ||
    msg.includes('anonymous sign-ins are disabled') ||
    msg.includes('anonymous provider disabled') ||
    msg.includes('signups not allowed')
  );
}

function safeStorage(): Storage | null {
  try {
    return typeof globalThis !== 'undefined' &&
      (globalThis as { localStorage?: Storage }).localStorage
      ? (globalThis as { localStorage: Storage }).localStorage
      : null;
  } catch {
    return null;
  }
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
        const storage = safeStorage();
        if (storage?.getItem(ANON_DISABLED_KEY) === '1') {
          // Server already told us anonymous sign-ins are off — skip the
          // request so we don't generate a 422 on every page load.
          return;
        }
        const anon = (client.auth as unknown as {
          signInAnonymously?: () => Promise<{ data: unknown; error: unknown }>;
        }).signInAnonymously;
        if (typeof anon === 'function') {
          try {
            const result = await anon.call(client.auth);
            if (result?.error && isAnonDisabledError(result.error)) {
              storage?.setItem(ANON_DISABLED_KEY, '1');
            }
          } catch (e) {
            if (isAnonDisabledError(e)) storage?.setItem(ANON_DISABLED_KEY, '1');
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
