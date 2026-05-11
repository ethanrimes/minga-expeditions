'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createSalida, updateSalida, deleteSalida } from '@minga/supabase';
import { requireAdmin } from '@/lib/auth';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getT } from '@/lib/i18n/server';
import { parseSalidaFormFields } from './parser';

export type SalidaFormState = { error?: string };

export async function createSalidaAction(
  expeditionId: string,
  _prev: SalidaFormState,
  formData: FormData,
): Promise<SalidaFormState> {
  await requireAdmin();
  const parsed = parseSalidaFormFields(formData);
  if ('errorKey' in parsed) {
    const { t } = await getT();
    return { error: t(parsed.errorKey) };
  }
  const supabase = await createSupabaseServerClient();
  try {
    await createSalida(supabase, { ...parsed.value, expedition_id: expeditionId });
  } catch (e) {
    return { error: (e as Error).message };
  }
  revalidatePath(`/expeditions/${expeditionId}/salidas`);
  revalidatePath('/expeditions/calendar');
  redirect(`/expeditions/${expeditionId}/salidas`);
}

export async function updateSalidaAction(
  expeditionId: string,
  salidaId: string,
  _prev: SalidaFormState,
  formData: FormData,
): Promise<SalidaFormState> {
  await requireAdmin();
  const parsed = parseSalidaFormFields(formData);
  if ('errorKey' in parsed) {
    const { t } = await getT();
    return { error: t(parsed.errorKey) };
  }
  const supabase = await createSupabaseServerClient();
  try {
    await updateSalida(supabase, salidaId, parsed.value);
  } catch (e) {
    return { error: (e as Error).message };
  }
  revalidatePath(`/expeditions/${expeditionId}/salidas`);
  revalidatePath('/expeditions/calendar');
  redirect(`/expeditions/${expeditionId}/salidas`);
}

export async function deleteSalidaAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get('id') ?? '');
  const expeditionId = String(formData.get('expedition_id') ?? '');
  if (!id) return;
  const supabase = await createSupabaseServerClient();
  await deleteSalida(supabase, id);
  if (expeditionId) revalidatePath(`/expeditions/${expeditionId}/salidas`);
  revalidatePath('/expeditions/calendar');
}
