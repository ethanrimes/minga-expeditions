import Link from 'next/link';
import { getT } from '@/lib/i18n/server';
import { ProviderForm } from '../ProviderForm';

export default async function NewProviderPage() {
  const { t } = await getT();
  return (
    <div className="flex flex-col gap-6">
      <Link href="/providers" className="text-sm text-primary font-semibold">
        {t('providers.back')}
      </Link>
      <h1 className="text-2xl font-bold">{t('providers.new')}</h1>
      <ProviderForm
        initial={null}
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
