import { fetchCommEventTypes, fetchCommTemplates } from '@minga/supabase';
import type { DbCommTemplate } from '@minga/types';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getT } from '@/lib/i18n/server';
import { TemplateEditor } from './TemplateEditor';

export default async function CommsAutomatedPage() {
  const supabase = await createSupabaseServerClient();
  const [events, templates] = await Promise.all([
    fetchCommEventTypes(supabase),
    fetchCommTemplates(supabase),
  ]);
  const { t } = await getT();

  // Index templates by event_key + locale + channel so the form can pre-fill.
  const idx = new Map<string, DbCommTemplate>();
  for (const tmpl of templates) {
    idx.set(`${tmpl.event_key}|${tmpl.locale}|${tmpl.channel}`, tmpl);
  }

  return (
    <div className="flex flex-col gap-8">
      {events.map((evt) => (
        <section key={evt.key} data-testid={`comms-event-${evt.key}`} className="card">
          <div className="flex items-baseline justify-between gap-4 mb-4">
            <div>
              <div className="text-xs uppercase tracking-wider text-ink-500">
                {t('comms.event.heading')}
              </div>
              <h2 className="font-bold text-lg">{evt.key}</h2>
            </div>
            <p className="text-sm text-ink-500 max-w-md">{evt.description}</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {(['en', 'es'] as const).flatMap((locale) =>
              (['email', 'whatsapp'] as const).map((channel) => {
                const tmpl = idx.get(`${evt.key}|${locale}|${channel}`) ?? null;
                return (
                  <TemplateEditor
                    key={`${evt.key}-${locale}-${channel}`}
                    eventKey={evt.key}
                    locale={locale}
                    channel={channel}
                    initial={tmpl}
                    labels={{
                      subject: t('comms.template.subject'),
                      body: t('comms.template.body'),
                      active: t('comms.template.active'),
                      save: t('comms.template.save'),
                      saved: t('comms.template.saved'),
                      empty: t('comms.template.empty'),
                      placeholdersHelp: t('comms.template.placeholdersHelp'),
                      channelLabel:
                        channel === 'email' ? t('comms.channel.email') : t('comms.channel.whatsapp'),
                    }}
                  />
                );
              }),
            )}
          </div>
        </section>
      ))}
    </div>
  );
}
