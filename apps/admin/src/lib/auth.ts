import { redirect } from 'next/navigation';
import type { AppRole, DbProfile } from '@minga/types';
import { createSupabaseServerClient } from './supabase/server';

export interface AdminSession {
  userId: string;
  email: string | null;
  profile: DbProfile;
}

// Throws via redirect() if the caller isn't signed in or isn't an admin.
// Use at the top of every protected page / server action.
export async function requireAdmin(): Promise<AdminSession> {
  const supabase = await createSupabaseServerClient();
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) redirect('/login');

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', u.user.id)
    .maybeSingle();

  if (error || !profile) redirect('/login?error=missing_profile');

  const role = (profile as DbProfile).role as AppRole;
  if (role !== 'admin') redirect('/login?error=not_admin');

  return {
    userId: u.user.id,
    email: u.user.email ?? null,
    profile: profile as DbProfile,
  };
}

// Soft variant — returns null when not authenticated, used by /login to
// auto-redirect already-signed-in admins to the dashboard.
export async function getCurrentAdmin(): Promise<AdminSession | null> {
  const supabase = await createSupabaseServerClient();
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', u.user.id)
    .maybeSingle();
  if (!profile) return null;
  if ((profile as DbProfile).role !== 'admin') return null;

  return {
    userId: u.user.id,
    email: u.user.email ?? null,
    profile: profile as DbProfile,
  };
}
