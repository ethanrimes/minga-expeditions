'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import {
  upsertCommBroadcastTemplate,
  deleteCommBroadcastTemplate,
  type CommBroadcastTemplateInput,
} from '@minga/supabase';
import type { CommBroadcastCategory, CommChannel, CommLocale } from '@minga/types';
import { requireAdmin } from '@/lib/auth';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getLocale } from '@/lib/i18n/server';
import { translate, type Key } from '@/lib/i18n/dictionary';

export type BroadcastFormState = { error?: string; saved?: boolean };

const CATEGORIES: ReadonlySet<CommBroadcastCategory> = new Set([
  'announcement',
  'promotion',
  'new_trip',
  'reminder',
  'other',
]);

function parseInput(formData: FormData, idForUpdate?: string): CommBroadcastTemplateInput | Key {
  const name = String(formData.get('name') ?? '').trim();
  const categoryRaw = String(formData.get('category') ?? 'announcement') as CommBroadcastCategory;
  const channel = String(formData.get('channel') ?? 'email') as CommChannel;
  const locale = String(formData.get('locale') ?? 'es') as CommLocale;
  const subjectRaw = String(formData.get('subject') ?? '').trim();
  const body = String(formData.get('body') ?? '').trim();

  if (!name) return 'error.broadcast.nameRequired';
  if (!body) return 'error.broadcast.bodyRequired';
  if (!CATEGORIES.has(categoryRaw)) return 'error.broadcast.invalidCategory';
  if (channel !== 'email' && channel !== 'whatsapp') return 'error.broadcast.invalidChannel';
  if (locale !== 'en' && locale !== 'es') return 'error.broadcast.invalidLocale';

  return {
    ...(idForUpdate ? { id: idForUpdate } : {}),
    name,
    category: categoryRaw,
    channel,
    locale,
    // WhatsApp doesn't carry a subject; force it to null so we don't store noise.
    subject: channel === 'email' ? (subjectRaw || null) : null,
    body,
  };
}

export async function createBroadcastTemplateAction(
  _prev: BroadcastFormState,
  formData: FormData,
): Promise<BroadcastFormState> {
  await requireAdmin();
  const input = parseInput(formData);
  if (typeof input === 'string') return { error: translate(await getLocale(), input) };
  const supabase = await createSupabaseServerClient();
  try {
    await upsertCommBroadcastTemplate(supabase, input);
  } catch (e) {
    return { error: (e as Error).message };
  }
  revalidatePath('/comms/broadcasts');
  redirect('/comms/broadcasts');
}

export async function updateBroadcastTemplateAction(
  id: string,
  _prev: BroadcastFormState,
  formData: FormData,
): Promise<BroadcastFormState> {
  await requireAdmin();
  const input = parseInput(formData, id);
  if (typeof input === 'string') return { error: translate(await getLocale(), input) };
  const supabase = await createSupabaseServerClient();
  try {
    await upsertCommBroadcastTemplate(supabase, input);
  } catch (e) {
    return { error: (e as Error).message };
  }
  revalidatePath('/comms/broadcasts');
  revalidatePath(`/comms/broadcasts/${id}`);
  return { saved: true };
}

export async function deleteBroadcastTemplateAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get('id') ?? '');
  if (!id) return;
  const supabase = await createSupabaseServerClient();
  await deleteCommBroadcastTemplate(supabase, id);
  revalidatePath('/comms/broadcasts');
  redirect('/comms/broadcasts');
}
