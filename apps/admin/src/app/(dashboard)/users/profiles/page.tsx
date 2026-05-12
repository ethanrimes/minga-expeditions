import Link from 'next/link';
import { fetchAdminProfiles } from '@minga/supabase';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { ProfilesTable } from './ProfilesTable';

export default async function UserProfilesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; tier?: string }>;
}) {
  const sp = await searchParams;
  const supabase = await createSupabaseServerClient();
  const profiles = await fetchAdminProfiles(supabase, {
    search: sp.q || undefined,
    tier: sp.tier || undefined,
  });

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-bold">User profiles</h1>
        <p className="text-sm text-ink-500 mt-1 max-w-2xl">
          All signed-up users. Click a row for trip history, comms preferences, and reviews
          received from providers.
        </p>
      </header>
      <ProfilesTable profiles={profiles} initialSearch={sp.q ?? ''} initialTier={sp.tier ?? ''} />
    </div>
  );
}
