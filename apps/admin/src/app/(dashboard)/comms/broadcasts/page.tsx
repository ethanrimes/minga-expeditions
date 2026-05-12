import Link from 'next/link';
import { fetchCommBroadcastTemplates } from '@minga/supabase';
import type { CommBroadcastCategory, DbCommBroadcastTemplate } from '@minga/types';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getT } from '@/lib/i18n/server';

const CATEGORY_ORDER: CommBroadcastCategory[] = [
  'announcement',
  'promotion',
  'new_trip',
  'reminder',
  'other',
];

export default async function BroadcastsPage() {
  const supabase = await createSupabaseServerClient();
  const templates = await fetchCommBroadcastTemplates(supabase);
  const { t } = await getT();

  const byCategory = new Map<CommBroadcastCategory, DbCommBroadcastTemplate[]>();
  for (const tmpl of templates) {
    const list = byCategory.get(tmpl.category) ?? [];
    list.push(tmpl);
    byCategory.set(tmpl.category, list);
  }

  const categoryLabels: Record<CommBroadcastCategory, string> = {
    announcement: t('comms.broadcasts.category.announcement'),
    promotion: t('comms.broadcasts.category.promotion'),
    new_trip: t('comms.broadcasts.category.new_trip'),
    reminder: t('comms.broadcasts.category.reminder'),
    other: t('comms.broadcasts.category.other'),
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-ink-500 max-w-2xl">{t('comms.broadcasts.subtitle')}</p>
        <Link href="/comms/broadcasts/new" className="btn-primary text-sm">
          + {t('comms.broadcasts.new')}
        </Link>
      </div>

      {templates.length === 0 ? (
        <p className="text-sm text-ink-500">{t('comms.broadcasts.empty')}</p>
      ) : null}

      {CATEGORY_ORDER.map((cat) => {
        const list = byCategory.get(cat);
        if (!list || list.length === 0) return null;
        return (
          <section key={cat} className="flex flex-col gap-3">
            <h2 className="text-sm uppercase tracking-wider text-ink-500 font-bold">
              {categoryLabels[cat]}
            </h2>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {list.map((tmpl) => (
                <li key={tmpl.id} className="card hover:border-primary/40 transition">
                  <Link
                    href={`/comms/broadcasts/${tmpl.id}`}
                    className="flex flex-col gap-2"
                    data-testid={`broadcast-card-${tmpl.id}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold">{tmpl.name}</span>
                      <span className="flex gap-1">
                        <Badge>
                          {tmpl.channel === 'email'
                            ? t('comms.channel.email')
                            : t('comms.channel.whatsapp')}
                        </Badge>
                        <Badge>{tmpl.locale.toUpperCase()}</Badge>
                      </span>
                    </div>
                    {tmpl.subject ? (
                      <p className="text-sm text-ink-700">{tmpl.subject}</p>
                    ) : null}
                    <p className="text-xs text-ink-500 line-clamp-3">{tmpl.body}</p>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded bg-surface-alt text-ink-700 border border-surface-border">
      {children}
    </span>
  );
}
