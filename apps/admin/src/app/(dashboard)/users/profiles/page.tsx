import Link from 'next/link';
import { fetchAdminProfiles } from '@minga/supabase';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getT } from '@/lib/i18n/server';
import { ProfilesTable } from './ProfilesTable';

export default async function UserProfilesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; tier?: string }>;
}) {
  const sp = await searchParams;
  const supabase = await createSupabaseServerClient();
  const { t } = await getT();
  const profiles = await fetchAdminProfiles(supabase, {
    search: sp.q || undefined,
    tier: sp.tier || undefined,
  });

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-bold">{t('users.profiles.title')}</h1>
        <p className="text-sm text-ink-500 mt-1 max-w-2xl">
          {t('users.profiles.subtitle')}
        </p>
      </header>
      <ProfilesTable
        profiles={profiles}
        initialSearch={sp.q ?? ''}
        initialTier={sp.tier ?? ''}
        labels={{
          search: t('common.search'),
          searchPlaceholder: t('users.profiles.placeholder.search'),
          tier: t('users.profiles.tier'),
          all: t('common.all'),
          apply: t('common.apply'),
          empty: t('users.profiles.empty'),
          name: t('common.name'),
          username: t('common.username'),
          country: t('users.profiles.country'),
          distance: t('users.profiles.distance'),
          joined: t('common.joined'),
        }}
      />
    </div>
  );
}
