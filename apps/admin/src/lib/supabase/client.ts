'use client';

import { createBrowserClient } from '@supabase/ssr';
import { env } from '../env';

let cached: ReturnType<typeof createBrowserClient> | null = null;

export function getBrowserSupabase() {
  if (!cached) {
    cached = createBrowserClient(env.supabaseUrl(), env.supabaseAnonKey());
  }
  return cached;
}
