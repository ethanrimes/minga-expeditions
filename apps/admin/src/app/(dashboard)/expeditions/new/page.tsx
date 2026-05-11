import { fetchCategories } from '@minga/supabase';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getT } from '@/lib/i18n/server';
import { ExpeditionForm } from '../ExpeditionForm';
import { createExpeditionAction } from '../actions';

export default async function NewExpeditionPage() {
  const supabase = await createSupabaseServerClient();
  const categories = await fetchCategories(supabase, { activeOnly: true });
  const { t, locale } = await getT();

  return (
    <div>
      <h1 className="text-2xl font-bold">{t('expeditions.newPage.title')}</h1>
      <p className="text-ink-500 mt-1">{t('expeditions.newPage.subtitle')}</p>
      <div className="mt-8">
        <ExpeditionForm
          action={createExpeditionAction}
          categories={categories}
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
            submit: t('expeditions.newPage.submit'),
          }}
        />
      </div>
    </div>
  );
}
