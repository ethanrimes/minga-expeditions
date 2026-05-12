import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CalendarRange } from 'lucide-react';
import { adminGetExpedition, adminListExpeditionPhotos, fetchCategories } from '@minga/supabase';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getT } from '@/lib/i18n/server';
import { ExpeditionForm } from '../ExpeditionForm';
import { updateExpeditionAction } from '../actions';
import { PhotoGallery } from './PhotoGallery';

export default async function EditExpeditionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const [expedition, categories, photos] = await Promise.all([
    adminGetExpedition(supabase, id),
    fetchCategories(supabase),
    adminListExpeditionPhotos(supabase, id),
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
            terrain: t('expForm.terrain'),
            terrainHelp: t('expForm.terrainHelp'),
            terrainTags: {
              mountain: t('expForm.terrain.mountain'),
              flat: t('expForm.terrain.flat'),
              desert: t('expForm.terrain.desert'),
              river: t('expForm.terrain.river'),
              forest: t('expForm.terrain.forest'),
              coast: t('expForm.terrain.coast'),
              urban: t('expForm.terrain.urban'),
              jungle: t('expForm.terrain.jungle'),
              snow: t('expForm.terrain.snow'),
            },
            official: t('expForm.official'),
            published: t('expForm.published'),
            saving: t('expForm.saving'),
            cancel: t('expForm.cancel'),
            submit: t('expeditions.editPage.submit'),
          }}
        />
      </div>

      <PhotoGallery
        expeditionId={id}
        photos={photos}
        labels={{
          heading: t('photoGallery.heading'),
          subtitle: t('photoGallery.subtitle'),
          upload: t('photoGallery.upload'),
          uploadHelp: t('photoGallery.uploadHelp'),
          empty: t('photoGallery.empty'),
          moveUp: t('photoGallery.moveUp'),
          moveDown: t('photoGallery.moveDown'),
          delete: t('photoGallery.delete'),
          coverBadge: t('photoGallery.coverBadge'),
        }}
      />
    </div>
  );
}
