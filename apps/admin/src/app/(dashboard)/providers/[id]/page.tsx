import Link from 'next/link';
import { notFound } from 'next/navigation';
import { fetchProvider } from '@minga/supabase';
import { getT } from '@/lib/i18n/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { ProviderForm } from '../ProviderForm';
import { deleteProviderAction } from '../actions';

export default async function EditProviderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const { t } = await getT();
  const provider = await fetchProvider(supabase, id);
  if (!provider) notFound();

  return (
    <div className="flex flex-col gap-6">
      <Link href="/providers" className="text-sm text-primary font-semibold">
        {t('providers.back')}
      </Link>
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">{provider.display_name}</h1>
        <form action={deleteProviderAction}>
          <input type="hidden" name="id" value={provider.id} />
          <button type="submit" className="btn-secondary text-xs text-danger">
            {t('providers.delete')}
          </button>
        </form>
      </div>
      <ProviderForm
        initial={provider}
        labels={{
          name: t('common.name'),
          vendorType: t('providers.vendorType'),
          none: t('providers.none'),
          region: t('common.region'),
          regionPlaceholder: t('providers.placeholder.region'),
          website: t('common.website'),
          email: t('common.email'),
          phone: t('common.phone'),
          whatsapp: t('common.whatsapp'),
          notes: t('common.notes'),
          activeHelp: t('providers.activeHelp'),
          saved: t('providers.saved'),
          saveChanges: t('common.saveChanges'),
          createProvider: t('providers.create'),
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
