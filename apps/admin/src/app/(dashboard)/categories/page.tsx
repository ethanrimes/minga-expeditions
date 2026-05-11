import Link from 'next/link';
import { Plus } from 'lucide-react';
import type { DbCategory } from '@minga/types';
import { fetchCategories } from '@minga/supabase';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getT } from '@/lib/i18n/server';
import { CategoryIcon } from '@/components/CategoryIcon';
import { deleteCategoryAction } from './actions';

export default async function CategoriesPage() {
  const supabase = await createSupabaseServerClient();
  const categories = await fetchCategories(supabase);
  const { t } = await getT();

  return (
    <div>
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{t('categories.title')}</h1>
          <p className="text-ink-500 mt-1">{t('categories.subtitle')}</p>
        </div>
        <Link href="/categories/new" className="btn-primary">
          <Plus size={16} /> {t('categories.new')}
        </Link>
      </header>

      <div className="mt-8 card p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface-alt text-left text-xs uppercase tracking-wide text-ink-500">
            <tr>
              <th className="px-4 py-3">{t('categories.col.slug')}</th>
              <th className="px-4 py-3">{t('categories.col.english')}</th>
              <th className="px-4 py-3">{t('categories.col.spanish')}</th>
              <th className="px-4 py-3">{t('categories.col.icon')}</th>
              <th className="px-4 py-3">{t('categories.col.sort')}</th>
              <th className="px-4 py-3">{t('categories.col.active')}</th>
              <th className="px-4 py-3 text-right">{t('categories.col.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((c: DbCategory) => (
              <tr key={c.id} className="border-t border-surface-border">
                <td className="px-4 py-3 font-mono text-xs">{c.slug}</td>
                <td className="px-4 py-3">{c.name_en}</td>
                <td className="px-4 py-3">{c.name_es}</td>
                <td className="px-4 py-3 text-ink-700">
                  {c.icon_name ? (
                    <span
                      className="inline-flex items-center gap-2"
                      title={c.icon_name}
                    >
                      <CategoryIcon name={c.icon_name} size={20} />
                      <span className="text-xs text-ink-500 font-mono">{c.icon_name}</span>
                    </span>
                  ) : (
                    <span className="text-ink-500">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-ink-500">{c.sort_order}</td>
                <td className="px-4 py-3">
                  <span
                    className={
                      c.is_active
                        ? 'inline-flex rounded-full bg-success/10 text-success px-2 py-0.5 text-xs font-semibold'
                        : 'inline-flex rounded-full bg-ink-300/20 text-ink-500 px-2 py-0.5 text-xs font-semibold'
                    }
                  >
                    {c.is_active ? t('categories.status.active') : t('categories.status.hidden')}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="inline-flex gap-2">
                    <Link href={`/categories/${c.id}`} className="btn-secondary text-xs">
                      {t('categories.action.edit')}
                    </Link>
                    <form action={deleteCategoryAction}>
                      <input type="hidden" name="id" value={c.id} />
                      <button
                        type="submit"
                        className="btn-secondary text-xs text-danger hover:bg-danger/10"
                      >
                        {t('categories.action.delete')}
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
            {categories.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-ink-500">
                  {t('categories.empty')}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
