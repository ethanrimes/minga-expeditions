import Link from 'next/link';
import { Plus } from 'lucide-react';
import type { DbCategory, DbExpedition } from '@minga/types';
import { adminListExpeditions, fetchCategories } from '@minga/supabase';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getT } from '@/lib/i18n/server';
import { deleteExpeditionAction } from './actions';

function formatPriceCents(price: number, currency: string, freeLabel: string) {
  if (!price) return freeLabel;
  const value = price / 100;
  try {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency }).format(value);
  } catch {
    return `${currency} ${value.toFixed(2)}`;
  }
}

export default async function ExpeditionsPage() {
  const supabase = await createSupabaseServerClient();
  const [expeditions, categories] = await Promise.all([
    adminListExpeditions(supabase, { limit: 200 }),
    fetchCategories(supabase),
  ]);
  const { t, locale } = await getT();
  const localizedName = (c: DbCategory) => (locale === 'es' ? c.name_es : c.name_en);
  const catName = new Map(categories.map((c: DbCategory) => [c.id, localizedName(c)]));

  return (
    <div>
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{t('expeditions.title')}</h1>
          <p className="text-ink-500 mt-1">{t('expeditions.subtitle')}</p>
        </div>
        <Link href="/expeditions/new" className="btn-primary">
          <Plus size={16} /> {t('expeditions.new')}
        </Link>
      </header>

      <div className="mt-8 card p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface-alt text-left text-xs uppercase tracking-wide text-ink-500">
            <tr>
              <th className="px-4 py-3">{t('expeditions.col.title')}</th>
              <th className="px-4 py-3">{t('expeditions.col.category')}</th>
              <th className="px-4 py-3">{t('expeditions.col.location')}</th>
              <th className="px-4 py-3">{t('expeditions.col.price')}</th>
              <th className="px-4 py-3">{t('expeditions.col.status')}</th>
              <th className="px-4 py-3 text-right">{t('expeditions.col.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {expeditions.map((e: DbExpedition) => (
              <tr key={e.id} className="border-t border-surface-border">
                <td className="px-4 py-3 font-medium">{e.title}</td>
                <td className="px-4 py-3 text-ink-500">{catName.get(e.category_id) ?? '—'}</td>
                <td className="px-4 py-3 text-ink-500">
                  {e.location_name}
                  {e.region ? `, ${e.region}` : ''}
                </td>
                <td className="px-4 py-3 text-ink-500">
                  {formatPriceCents(e.price_cents, e.currency, t('expeditions.free'))}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={
                      e.is_published
                        ? 'inline-flex rounded-full bg-success/10 text-success px-2 py-0.5 text-xs font-semibold'
                        : 'inline-flex rounded-full bg-ink-300/20 text-ink-500 px-2 py-0.5 text-xs font-semibold'
                    }
                  >
                    {e.is_published ? t('expeditions.status.published') : t('expeditions.status.draft')}
                  </span>
                  {e.is_official ? (
                    <span className="ml-2 inline-flex rounded-full bg-primary/10 text-primary px-2 py-0.5 text-xs font-semibold">
                      {t('expeditions.badge.official')}
                    </span>
                  ) : null}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="inline-flex gap-2">
                    <Link href={`/expeditions/${e.id}`} className="btn-secondary text-xs">
                      {t('categories.action.edit')}
                    </Link>
                    <form action={deleteExpeditionAction}>
                      <input type="hidden" name="id" value={e.id} />
                      <button type="submit" className="btn-secondary text-xs text-danger hover:bg-danger/10">
                        {t('categories.action.delete')}
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
            {expeditions.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-ink-500">
                  {t('expeditions.empty')}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
