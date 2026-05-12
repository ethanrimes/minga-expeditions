import { Stub } from '@/components/Stub';
import { getT } from '@/lib/i18n/server';

export default async function UserProfilesPage() {
  const { t } = await getT();
  return (
    <Stub
      heading={t('sidebar.item.userProfiles')}
      title={t('stub.title')}
      subtitle={t('stub.subtitle')}
      ready={t('stub.dataReady')}
    />
  );
}
