import Link from 'next/link';
import { Plus } from 'lucide-react';
import type { DbCategory } from '@minga/types';
import { adminListItineraries, fetchCategories, fetchProviders } from '@minga/supabase';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getT } from '@/lib/i18n/server';
import { ItinerariesView } from './ItinerariesView';

export default async function ItinerariesPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    category?: string;
    region?: string;
    status?: 'published' | 'draft';
    provider?: string;
    group?: 'category' | 'region' | 'status' | 'provider';
  }>;
}) {
  const sp = await searchParams;
  const supabase = await createSupabaseServerClient();
  const [itineraries, categories, providers] = await Promise.all([
    adminListItineraries(supabase, {
      search: sp.q || undefined,
      categoryId: sp.category || undefined,
      region: sp.region || undefined,
      status: sp.status || undefined,
      providerId: sp.provider || undefined,
    }),
    fetchCategories(supabase),
    fetchProviders(supabase, { includeInactive: true }),
  ]);
  const { t, locale } = await getT();
  const localizedCatName = (c: DbCategory) => (locale === 'es' ? c.name_es : c.name_en);
  const catName = new Map(categories.map((c) => [c.id, localizedCatName(c)]));

  // Compute the set of regions actually present in the data for the filter.
  const regions = Array.from(new Set(itineraries.map((i) => i.region).filter(Boolean))) as string[];

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Itineraries</h1>
          <p className="text-ink-500 mt-1 text-sm max-w-2xl">
            Trip templates that show up in the consumer apps. Each itinerary can host multiple
            salidas (dated departures).
          </p>
        </div>
        <Link href="/expeditions/new" className="btn-primary">
          <Plus size={16} /> {t('expeditions.new')}
        </Link>
      </header>

      <ItinerariesView
        itineraries={itineraries}
        categories={categories.map((c) => ({ id: c.id, label: localizedCatName(c) }))}
        providers={providers}
        regions={regions}
        catName={Object.fromEntries(catName)}
        initial={{
          q: sp.q ?? '',
          category: sp.category ?? '',
          region: sp.region ?? '',
          status: sp.status ?? '',
          provider: sp.provider ?? '',
          group: sp.group ?? 'category',
        }}
      />
    </div>
  );
}
