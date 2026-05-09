import Link from 'next/link';
import { Plus } from 'lucide-react';
import type { DbCategory } from '@minga/types';
import { fetchCategories } from '@minga/supabase';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { deleteCategoryAction } from './actions';

export default async function CategoriesPage() {
  const supabase = await createSupabaseServerClient();
  const categories = await fetchCategories(supabase);

  return (
    <div>
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Categories</h1>
          <p className="text-ink-500 mt-1">Drives the filters in the mobile app and the picker on each expedition.</p>
        </div>
        <Link href="/categories/new" className="btn-primary">
          <Plus size={16} /> New category
        </Link>
      </header>

      <div className="mt-8 card p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface-alt text-left text-xs uppercase tracking-wide text-ink-500">
            <tr>
              <th className="px-4 py-3">Slug</th>
              <th className="px-4 py-3">English</th>
              <th className="px-4 py-3">Español</th>
              <th className="px-4 py-3">Icon</th>
              <th className="px-4 py-3">Sort</th>
              <th className="px-4 py-3">Active</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((c: DbCategory) => (
              <tr key={c.id} className="border-t border-surface-border">
                <td className="px-4 py-3 font-mono text-xs">{c.slug}</td>
                <td className="px-4 py-3">{c.name_en}</td>
                <td className="px-4 py-3">{c.name_es}</td>
                <td className="px-4 py-3 text-ink-500">{c.icon_name ?? '—'}</td>
                <td className="px-4 py-3 text-ink-500">{c.sort_order}</td>
                <td className="px-4 py-3">
                  <span
                    className={
                      c.is_active
                        ? 'inline-flex rounded-full bg-success/10 text-success px-2 py-0.5 text-xs font-semibold'
                        : 'inline-flex rounded-full bg-ink-300/20 text-ink-500 px-2 py-0.5 text-xs font-semibold'
                    }
                  >
                    {c.is_active ? 'Active' : 'Hidden'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="inline-flex gap-2">
                    <Link href={`/categories/${c.id}`} className="btn-secondary text-xs">
                      Edit
                    </Link>
                    <form action={deleteCategoryAction}>
                      <input type="hidden" name="id" value={c.id} />
                      <button
                        type="submit"
                        className="btn-secondary text-xs text-danger hover:bg-danger/10"
                      >
                        Delete
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
            {categories.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-ink-500">
                  No categories yet — create the first one.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
