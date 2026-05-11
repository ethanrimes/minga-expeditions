'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import {
  createExpedition,
  deleteExpedition,
  updateExpedition,
  uploadExpeditionPhoto,
} from '@minga/supabase';
import { requireAdmin } from '@/lib/auth';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getT } from '@/lib/i18n/server';
import { parseExpeditionFormFields } from './parser';

export type ExpeditionFormState = { error?: string };

async function parseExpeditionForm(formData: FormData) {
  const fields = parseExpeditionFormFields(formData);
  if ('errorKey' in fields) return fields;

  const supabase = await createSupabaseServerClient();

  // Optional cover photo. Uploaded only if a file was selected.
  let cover_photo_url: string | null = null;
  const photo = formData.get('cover_photo') as File | null;
  if (photo && photo.size > 0) {
    try {
      const { publicUrl } = await uploadExpeditionPhoto(supabase, photo, photo.name);
      cover_photo_url = publicUrl;
    } catch (e) {
      const { t } = await getT();
      return {
        error: t('error.expedition.photoFailed', { msg: (e as Error).message }),
      };
    }
  } else {
    const existing = String(formData.get('cover_photo_url') ?? '').trim();
    cover_photo_url = existing || null;
  }

  return { value: { ...fields.value, cover_photo_url } };
}

export async function createExpeditionAction(
  _prev: ExpeditionFormState,
  formData: FormData,
): Promise<ExpeditionFormState> {
  const session = await requireAdmin();
  const parsed = await parseExpeditionForm(formData);
  if ('errorKey' in parsed) {
    const { t } = await getT();
    return { error: t(parsed.errorKey) };
  }
  if ('error' in parsed) return { error: parsed.error };

  const supabase = await createSupabaseServerClient();
  try {
    await createExpedition(supabase, { ...parsed.value, author_id: session.userId });
  } catch (e) {
    return { error: (e as Error).message };
  }
  revalidatePath('/expeditions');
  redirect('/expeditions');
}

export async function updateExpeditionAction(
  id: string,
  _prev: ExpeditionFormState,
  formData: FormData,
): Promise<ExpeditionFormState> {
  await requireAdmin();
  const parsed = await parseExpeditionForm(formData);
  if ('errorKey' in parsed) {
    const { t } = await getT();
    return { error: t(parsed.errorKey) };
  }
  if ('error' in parsed) return { error: parsed.error };

  const supabase = await createSupabaseServerClient();
  try {
    await updateExpedition(supabase, id, parsed.value);
  } catch (e) {
    return { error: (e as Error).message };
  }
  revalidatePath('/expeditions');
  redirect('/expeditions');
}

export async function deleteExpeditionAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get('id') ?? '');
  if (!id) return;
  const supabase = await createSupabaseServerClient();
  await deleteExpedition(supabase, id);
  revalidatePath('/expeditions');
}
