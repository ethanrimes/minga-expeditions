import Link from 'next/link';
import { getT } from '@/lib/i18n/server';
import { BroadcastEditor } from '../BroadcastEditor';

export default async function NewBroadcastPage() {
  const { t } = await getT();
  return (
    <div className="flex flex-col gap-6">
      <Link href="/comms/broadcasts" className="text-sm text-primary font-semibold">
        ← {t('comms.broadcasts.back')}
      </Link>
      <h2 className="text-xl font-bold">{t('comms.broadcasts.newTitle')}</h2>
      <BroadcastEditor
        initial={null}
        labels={{
          name: t('comms.broadcasts.field.name'),
          category: t('comms.broadcasts.field.category'),
          channel: t('comms.broadcasts.field.channel'),
          locale: t('comms.broadcasts.field.locale'),
          subject: t('comms.broadcasts.field.subject'),
          body: t('comms.broadcasts.field.body'),
          save: t('comms.broadcasts.save'),
          saved: t('comms.broadcasts.saved'),
          placeholdersHelp: t('comms.template.placeholdersHelp'),
          channels: {
            email: t('comms.channel.email'),
            whatsapp: t('comms.channel.whatsapp'),
          },
          categories: {
            announcement: t('comms.broadcasts.category.announcement'),
            promotion: t('comms.broadcasts.category.promotion'),
            new_trip: t('comms.broadcasts.category.new_trip'),
            reminder: t('comms.broadcasts.category.reminder'),
            other: t('comms.broadcasts.category.other'),
          },
        }}
      />
    </div>
  );
}
