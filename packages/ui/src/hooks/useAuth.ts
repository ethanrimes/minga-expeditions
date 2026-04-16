import { useEffect, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { getSupabase } from '@minga/supabase';

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const client = getSupabase();
    client.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data: sub } = client.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await getSupabase().auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signUp = async (email: string, password: string, displayName: string, username: string) => {
    const { error } = await getSupabase().auth.signUp({
      email,
      password,
      options: { data: { display_name: displayName, username } },
    });
    if (error) throw error;
  };

  const signOut = async () => {
    await getSupabase().auth.signOut();
  };

  return {
    session,
    user: (session?.user as User | undefined) ?? null,
    loading,
    signIn,
    signUp,
    signOut,
  };
}
