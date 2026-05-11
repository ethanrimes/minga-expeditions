'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createCategory, deleteCategory, updateCategory } from '@minga/supabase';
import { requireAdmin } from '@/lib/auth';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getT } from '@/lib/i18n/server';
import { parseCategoryForm } from './parser';

export type CategoryFormState = { error?: string };

export async function createCategoryAction(
  _prev: CategoryFormState,
  formData: FormData,
): Promise<CategoryFormState> {
  await requireAdmin();
  const parsed = parseCategoryForm(formData);
  if ('errorKey' in parsed) {
    const { t } = await getT();
    return { error: t(parsed.errorKey) };
  }

  const supabase = await createSupabaseServerClient();
  try {
    await createCategory(supabase, parsed.value);
  } catch (e) {
    return { error: (e as Error).message };
  }
  revalidatePath('/categories');
  redirect('/categories');
}

export async function updateCategoryAction(
  id: string,
  _prev: CategoryFormState,
  formData: FormData,
): Promise<CategoryFormState> {
  await requireAdmin();
  const parsed = parseCategoryForm(formData);
  if ('errorKey' in parsed) {
    const { t } = await getT();
    return { error: t(parsed.errorKey) };
  }

  const supabase = await createSupabaseServerClient();
  try {
    await updateCategory(supabase, id, parsed.value);
  } catch (e) {
    return { error: (e as Error).message };
  }
  revalidatePath('/categories');
  redirect('/categories');
}

export async function deleteCategoryAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get('id') ?? '');
  if (!id) return;
  const supabase = await createSupabaseServerClient();
  await deleteCategory(supabase, id);
  revalidatePath('/categories');
}
