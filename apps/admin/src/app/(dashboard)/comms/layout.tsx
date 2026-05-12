import { getT } from '@/lib/i18n/server';
import { CommsTabs } from './CommsTabs';

export default async function CommsLayout({ children }: { children: React.ReactNode }) {
  const { t } = await getT();
  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-bold">{t('comms.title')}</h1>
        <p className="text-ink-500 mt-1 text-sm max-w-2xl">{t('comms.subtitle')}</p>
      </header>
      <CommsTabs
        tabs={[
          {
            href: '/comms/automated',
            label: t('comms.tabs.automated'),
            description: t('comms.tabs.automatedDesc'),
          },
          {
            href: '/comms/broadcasts',
            label: t('comms.tabs.broadcasts'),
            description: t('comms.tabs.broadcastsDesc'),
          },
        ]}
      />
      <div>{children}</div>
    </div>
  );
}
