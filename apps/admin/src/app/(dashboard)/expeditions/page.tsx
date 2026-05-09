import Link from 'next/link';
import { Plus } from 'lucide-react';
import type { DbCategory, DbExpedition } from '@minga/types';
import { adminListExpeditions, fetchCategories } from '@minga/supabase';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { deleteExpeditionAction } from './actions';

function formatPriceCents(price: number, currency: string) {
  if (!price) return 'Free';
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

  const catName = new Map(categories.map((c: DbCategory) => [c.id, c.name_en]));

  return (
    <div>
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Expeditions</h1>
          <p className="text-ink-500 mt-1">Curated experiences shown in the mobile feed.</p>
        </div>
        <Link href="/expeditions/new" className="btn-primary">
          <Plus size={16} /> New expedition
        </Link>
      </header>

      <div className="mt-8 card p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface-alt text-left text-xs uppercase tracking-wide text-ink-500">
            <tr>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Location</th>
              <th className="px-4 py-3">Price</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
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
                <td className="px-4 py-3 text-ink-500">{formatPriceCents(e.price_cents, e.currency)}</td>
                <td className="px-4 py-3">
                  <span
                    className={
                      e.is_published
                        ? 'inline-flex rounded-full bg-success/10 text-success px-2 py-0.5 text-xs font-semibold'
                        : 'inline-flex rounded-full bg-ink-300/20 text-ink-500 px-2 py-0.5 text-xs font-semibold'
                    }
                  >
                    {e.is_published ? 'Published' : 'Draft'}
                  </span>
                  {e.is_official ? (
                    <span className="ml-2 inline-flex rounded-full bg-primary/10 text-primary px-2 py-0.5 text-xs font-semibold">
                      Official
                    </span>
                  ) : null}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="inline-flex gap-2">
                    <Link href={`/expeditions/${e.id}`} className="btn-secondary text-xs">
                      Edit
                    </Link>
                    <form action={deleteExpeditionAction}>
                      <input type="hidden" name="id" value={e.id} />
                      <button type="submit" className="btn-secondary text-xs text-danger hover:bg-danger/10">
                        Delete
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
            {expeditions.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-ink-500">
                  No expeditions yet — create the first one.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
