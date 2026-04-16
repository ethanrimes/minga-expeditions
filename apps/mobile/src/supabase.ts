import AsyncStorage from '@react-native-async-storage/async-storage';
import { initSupabase } from '@minga/supabase';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  // Hard fail so devs notice missing env config quickly.
  throw new Error('Missing EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY — see apps/mobile/.env.example');
}

export const supabase = initSupabase({
  url,
  anonKey,
  storage: AsyncStorage,
});
