import Link from 'next/link';
import { fetchProviders } from '@minga/supabase';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getT } from '@/lib/i18n/server';
import { ProvidersTable } from './ProvidersTable';

export default async function ProvidersDirectoryPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; type?: string; include_inactive?: string }>;
}) {
  const sp = await searchParams;
  const supabase = await createSupabaseServerClient();
  const { t } = await getT();
  const providers = await fetchProviders(supabase, {
    search: sp.q || undefined,
    vendorType: (sp.type as never) || undefined,
    includeInactive: sp.include_inactive === '1',
  });

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{t('providers.title')}</h1>
          <p className="text-sm text-ink-500 mt-1 max-w-2xl">
            {t('providers.subtitle')}
          </p>
        </div>
        <Link href="/providers/new" className="btn-primary text-sm">
          + {t('providers.new')}
        </Link>
      </header>

      <ProvidersTable
        providers={providers}
        initialSearch={sp.q ?? ''}
        initialType={sp.type ?? ''}
        labels={{
          search: t('common.search'),
          namePlaceholder: t('providers.placeholder.name'),
          vendorType: t('providers.vendorType'),
          all: t('common.all'),
          apply: t('common.apply'),
          empty: t('providers.empty'),
          name: t('common.name'),
          type: t('common.type'),
          region: t('common.region'),
          contact: t('common.contact'),
          status: t('common.status'),
          active: t('common.active'),
          inactive: t('common.inactive'),
          vendorTypes: {
            full_experience: t('proposals.type.full_experience'),
            transportation: t('proposals.type.transportation'),
            lodging: t('proposals.type.lodging'),
            guide: t('proposals.type.guide'),
            food: t('proposals.type.food'),
            other: t('proposals.type.other'),
          },
        }}
      />
    </div>
  );
}
