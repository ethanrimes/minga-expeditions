import Link from 'next/link';
import { notFound } from 'next/navigation';
import { fetchCommBroadcastTemplate } from '@minga/supabase';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getT } from '@/lib/i18n/server';
import { BroadcastEditor } from '../BroadcastEditor';
import { deleteBroadcastTemplateAction } from '../actions';

export default async function EditBroadcastPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const tmpl = await fetchCommBroadcastTemplate(supabase, id);
  if (!tmpl) notFound();
  const { t } = await getT();

  return (
    <div className="flex flex-col gap-6">
      <Link href="/comms/broadcasts" className="text-sm text-primary font-semibold">
        ← {t('comms.broadcasts.back')}
      </Link>
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-xl font-bold">{tmpl.name}</h2>
        <form action={deleteBroadcastTemplateAction}>
          <input type="hidden" name="id" value={tmpl.id} />
          <button type="submit" className="btn-secondary text-xs text-danger">
            {t('comms.broadcasts.delete')}
          </button>
        </form>
      </div>
      <BroadcastEditor
        initial={tmpl}
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
