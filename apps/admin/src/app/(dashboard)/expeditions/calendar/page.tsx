import { adminListSalidasInRange, fetchCategories } from '@minga/supabase';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getT } from '@/lib/i18n/server';
import { CalendarClient } from './CalendarClient';

// Initial server fetch loads a 12-month window so the client can move forward
// and back without an extra round-trip on every arrow press. Cheap because
// salidas are a small table.
function defaultRange(): { from: string; to: string } {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
  const to = new Date(now.getFullYear(), now.getMonth() + 11, 0, 23, 59, 59).toISOString();
  return { from, to };
}

export default async function AdminCalendarPage() {
  const supabase = await createSupabaseServerClient();
  const { from, to } = defaultRange();
  const [salidas, categories] = await Promise.all([
    adminListSalidasInRange(supabase, from, to),
    fetchCategories(supabase, { activeOnly: false }),
  ]);
  const { t, locale } = await getT();

  return (
    <div>
      <header>
        <h1 className="text-2xl font-bold">{t('calendar.title')}</h1>
        <p className="text-ink-500 mt-1 text-sm">{t('calendar.subtitle')}</p>
      </header>
      <div className="mt-8">
        <CalendarClient
          salidas={salidas}
          categories={categories}
          locale={locale}
          labels={{
            prev: t('calendar.prev'),
            next: t('calendar.next'),
            today: t('calendar.today'),
            empty: t('calendar.empty'),
            filtersTitle: t('calendar.filters.title'),
            category: t('calendar.filters.category'),
            region: t('calendar.filters.region'),
            difficulty: t('calendar.filters.difficulty'),
            price: t('calendar.filters.price'),
            all: t('calendar.filters.all'),
            free: t('calendar.filters.free'),
            paid: t('calendar.filters.paid'),
            reset: t('calendar.filters.reset'),
            legendPublished: t('calendar.legend.published'),
            legendDraft: t('calendar.legend.draft'),
            legendSoldOut: t('calendar.legend.soldOut'),
          }}
        />
      </div>
    </div>
  );
}
