// Pure form-parsing logic. Pulled out of actions.ts so it can be unit-tested
// without spinning up the next/headers + Supabase server-side stack.

export interface CategoryFormValue {
  slug: string;
  name_en: string;
  name_es: string;
  icon_name: string | null;
  sort_order: number;
  is_active: boolean;
}

export type CategoryFormParseResult =
  | { value: CategoryFormValue }
  | { error: string };

export function parseCategoryForm(formData: FormData): CategoryFormParseResult {
  const slug = String(formData.get('slug') ?? '').trim();
  const name_en = String(formData.get('name_en') ?? '').trim();
  const name_es = String(formData.get('name_es') ?? '').trim();
  const icon_name = String(formData.get('icon_name') ?? '').trim() || null;
  const sort_order = Number(formData.get('sort_order') ?? 0) || 0;
  const is_active = formData.get('is_active') === 'on';

  if (!slug || !name_en || !name_es) {
    return { error: 'Slug, English name, and Spanish name are required.' };
  }
  if (!/^[a-z0-9-]+$/.test(slug)) {
    return { error: 'Slug must be lowercase letters, numbers, and dashes only.' };
  }
  return { value: { slug, name_en, name_es, icon_name, sort_order, is_active } };
}
