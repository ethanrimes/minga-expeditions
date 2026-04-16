import { initSupabase } from '@minga/supabase';

// Vite inlines import.meta.env.VITE_* at build time.
const env = import.meta.env as unknown as Record<string, string>;

export const supabase = initSupabase({
  url: env.VITE_SUPABASE_URL,
  anonKey: env.VITE_SUPABASE_ANON_KEY,
});
