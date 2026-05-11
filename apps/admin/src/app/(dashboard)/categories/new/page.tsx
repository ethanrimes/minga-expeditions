import { CategoryForm } from '../CategoryForm';
import { createCategoryAction } from '../actions';
import { getT } from '@/lib/i18n/server';

export default async function NewCategoryPage() {
  const { t } = await getT();
  return (
    <div>
      <h1 className="text-2xl font-bold">{t('categories.newPage.title')}</h1>
      <p className="text-ink-500 mt-1">{t('categories.newPage.subtitle')}</p>
      <div className="mt-8">
        <CategoryForm
          action={createCategoryAction}
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
            submit: t('categories.newPage.submit'),
          }}
        />
      </div>
    </div>
  );
}
