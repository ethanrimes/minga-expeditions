import { createClient, type SupabaseClient, type SupabaseClientOptions } from '@supabase/supabase-js';

export interface SupabaseEnv {
  url: string;
  anonKey: string;
  // Optional storage adapter — RN provides AsyncStorage, browsers default to localStorage.
  storage?: SupabaseClientOptions<'public'>['auth']['storage'];
}

let cached: SupabaseClient | null = null;

export function createMingaClient(env: SupabaseEnv): SupabaseClient {
  if (!env.url || !env.anonKey) {
    throw new Error('Supabase env missing — ensure SUPABASE_URL and SUPABASE_ANON_KEY are set');
  }
  return createClient(env.url, env.anonKey, {
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
