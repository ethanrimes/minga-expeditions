import AsyncStorage from '@react-native-async-storage/async-storage';
import { initSupabase } from '@minga/supabase';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  // Expo only reads .env at Metro bundler startup, so a missing file here
  // almost always means "you have apps/mobile/.env.example but not
  // apps/mobile/.env yet". Spell out the fix so it's copy-pasteable.
  throw new Error(
    [
      'Missing Supabase env in apps/mobile.',
      '',
      'Fix:',
      '  cp apps/mobile/.env.example apps/mobile/.env',
      '',
      'Then fully restart the Expo dev server (Ctrl+C and re-run).',
      'Expo only reads .env at bundler startup — HMR will not pick it up.',
    ].join('\n'),
  );
}

export const supabase = initSupabase({
  url,
  anonKey,
  storage: AsyncStorage,
});
