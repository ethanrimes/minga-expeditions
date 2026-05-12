'use server';

import { revalidatePath } from 'next/cache';
import { upsertCommTemplate, type CommTemplateInput } from '@minga/supabase';
import { requireAdmin } from '@/lib/auth';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export type CommTemplateFormState = { error?: string; saved?: boolean };

export async function saveCommTemplateAction(
  _prev: CommTemplateFormState,
  formData: FormData,
): Promise<CommTemplateFormState> {
  await requireAdmin();
  const input: CommTemplateInput = {
    event_key: String(formData.get('event_key') ?? ''),
    locale: String(formData.get('locale') ?? 'es') as 'en' | 'es',
    channel: String(formData.get('channel') ?? 'email') as 'email' | 'whatsapp',
    subject: String(formData.get('subject') ?? '').trim() || null,
    body: String(formData.get('body') ?? '').trim(),
    is_active: formData.get('is_active') === 'on',
  };
  if (!input.event_key || !input.body) {
    return { error: 'event_key and body are required' };
  }
  const supabase = await createSupabaseServerClient();
  try {
    await upsertCommTemplate(supabase, input);
  } catch (e) {
    return { error: (e as Error).message };
  }
  revalidatePath('/comms/automated');
  return { saved: true };
}
