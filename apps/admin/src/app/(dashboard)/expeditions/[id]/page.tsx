import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CalendarRange } from 'lucide-react';
import { adminGetExpedition, fetchCategories } from '@minga/supabase';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getT } from '@/lib/i18n/server';
import { ExpeditionForm } from '../ExpeditionForm';
import { updateExpeditionAction } from '../actions';

export default async function EditExpeditionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const [expedition, categories] = await Promise.all([
    adminGetExpedition(supabase, id),
    fetchCategories(supabase),
  ]);
  if (!expedition) notFound();
  const { t, locale } = await getT();

  const action = updateExpeditionAction.bind(null, id);

  return (
    <div>
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">{t('expeditions.editPage.title')}</h1>
          <p className="text-ink-500 mt-1 text-sm">{expedition.title}</p>
        </div>
        <Link href={`/expeditions/${id}/salidas`} className="btn-secondary">
          <CalendarRange size={16} /> {t('salidas.manage')}
        </Link>
      </div>
      <div className="mt-8">
        <ExpeditionForm
          action={action}
          categories={categories}
          initial={expedition}
          locale={locale}
          labels={{
            title: t('expForm.title'),
            description: t('expForm.description'),
            category: t('expForm.category'),
            selectCategory: t('expForm.selectCategory'),
            difficulty: t('expForm.difficulty'),
            location: t('expForm.location'),
            region: t('expForm.region'),
            country: t('expForm.country'),
            startLat: t('expForm.startLat'),
            startLng: t('expForm.startLng'),
            locationSearch: t('expForm.locationSearch'),
            locationSearchPlaceholder: t('expForm.locationSearchPlaceholder'),
            locationSearching: t('expForm.locationSearching'),
            locationNoResults: t('expForm.locationNoResults'),
            locationHelp: t('expForm.locationHelp'),
            distance: t('expForm.distance'),
            elevation: t('expForm.elevation'),
            currency: t('expForm.currency'),
            priceCents: t('expForm.priceCents'),
            priceHelp: t('expForm.priceHelp'),
            coverPhoto: t('expForm.coverPhoto'),
            coverPreviewAlt: t('expForm.coverPreviewAlt'),
            coverHelp: t('expForm.coverHelp'),
            official: t('expForm.official'),
            published: t('expForm.published'),
            saving: t('expForm.saving'),
            cancel: t('expForm.cancel'),
            submit: t('expeditions.editPage.submit'),
          }}
        />
      </div>
    </div>
  );
}
