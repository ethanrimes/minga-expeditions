import { initSupabase } from '@minga/supabase';

// Vite inlines import.meta.env.VITE_* at build time.
const env = import.meta.env as unknown as Record<string, string>;

// `Allow anonymous sign-ins` is off on this project's Supabase, so leave
// the auto-anon bootstrap off by default to keep the network log clean.
// Set VITE_SUPABASE_AUTO_ANONYMOUS=true in .env.local once it's enabled.
const autoAnonymous = env.VITE_SUPABASE_AUTO_ANONYMOUS === 'true';

export const supabase = initSupabase({
  url: env.VITE_SUPABASE_URL,
  anonKey: env.VITE_SUPABASE_ANON_KEY,
  autoAnonymous,
});
