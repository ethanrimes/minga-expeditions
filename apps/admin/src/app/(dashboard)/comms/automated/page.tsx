import { fetchCommEventTypes, fetchCommTemplates } from '@minga/supabase';
import type { DbCommTemplate } from '@minga/types';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getT } from '@/lib/i18n/server';
import { EventCard } from './EventCard';

export default async function CommsAutomatedPage() {
  const supabase = await createSupabaseServerClient();
  const [events, templates] = await Promise.all([
    fetchCommEventTypes(supabase),
    fetchCommTemplates(supabase),
  ]);
  const { t } = await getT();

  const byEvent = new Map<string, DbCommTemplate[]>();
  for (const tmpl of templates) {
    const list = byEvent.get(tmpl.event_key) ?? [];
    list.push(tmpl);
    byEvent.set(tmpl.event_key, list);
  }

  const labels = {
    active: 'Active',
    inactive: 'Draft',
    setActive: 'Make active',
    delete: t('comms.broadcasts.delete'),
    addTemplate: 'Add template',
    editor: {
      name: t('comms.broadcasts.field.name'),
      subject: t('comms.template.subject'),
      body: t('comms.template.body'),
      active: t('comms.template.active'),
      save: t('comms.template.save'),
      saved: t('comms.template.saved'),
      placeholdersHelp: t('comms.template.placeholdersHelp'),
    },
  };

  return (
    <div className="flex flex-col gap-8">
      {events.map((evt) => (
        <EventCard
          key={evt.key}
          eventKey={evt.key}
          eventDescription={evt.description}
          placeholders={evt.placeholders ?? []}
          templates={byEvent.get(evt.key) ?? []}
          labels={labels}
        />
      ))}
    </div>
  );
}
