import { notFound } from 'next/navigation';
import { fetchCategoryById } from '@minga/supabase';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getT } from '@/lib/i18n/server';
import { CategoryForm } from '../CategoryForm';
import { updateCategoryAction } from '../actions';

export default async function EditCategoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const category = await fetchCategoryById(supabase, id);
  if (!category) notFound();

  const { t } = await getT();
  const action = updateCategoryAction.bind(null, id);

  return (
    <div>
      <h1 className="text-2xl font-bold">{t('categories.editPage.title')}</h1>
      <p className="text-ink-500 mt-1 font-mono text-xs">{category.slug}</p>
      <div className="mt-8">
        <CategoryForm
          action={action}
          initial={category}
          labels={{
            slug: t('categoryForm.slug'),
            slugHelp: t('categoryForm.slugHelp'),
            nameEn: t('categoryForm.nameEn'),
            nameEs: t('categoryForm.nameEs'),
            icon: t('categoryForm.icon'),
            iconNone: t('categoryForm.iconNone'),
            iconHelp: t('categoryForm.iconHelp'),
            sortOrder: t('categoryForm.sortOrder'),
            visible: t('categoryForm.visible'),
            saving: t('categoryForm.saving'),
            cancel: t('categoryForm.cancel'),
            submit: t('categories.editPage.submit'),
          }}
        />
      </div>
    </div>
  );
}
