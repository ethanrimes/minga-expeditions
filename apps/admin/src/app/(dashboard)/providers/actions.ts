'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { deleteProvider, upsertProvider, type ProviderInput } from '@minga/supabase';
import type { VendorType } from '@minga/types';
import { requireAdmin } from '@/lib/auth';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export type ProviderFormState = { error?: string; saved?: boolean };

const VENDOR_TYPES: ReadonlySet<VendorType> = new Set([
  'full_experience',
  'transportation',
  'lodging',
  'guide',
  'food',
  'other',
]);

function parseInput(formData: FormData, idForUpdate?: string): ProviderInput | string {
  const display_name = String(formData.get('display_name') ?? '').trim();
  if (!display_name) return 'Name is required';
  const vt = String(formData.get('vendor_type') ?? '').trim() as VendorType;
  const vendor_type = vt && VENDOR_TYPES.has(vt) ? vt : null;
  return {
    ...(idForUpdate ? { id: idForUpdate } : {}),
    display_name,
    vendor_type,
    region: String(formData.get('region') ?? '').trim() || null,
    contact_email: String(formData.get('contact_email') ?? '').trim() || null,
    contact_phone: String(formData.get('contact_phone') ?? '').trim() || null,
    whatsapp: String(formData.get('whatsapp') ?? '').trim() || null,
    website: String(formData.get('website') ?? '').trim() || null,
    notes: String(formData.get('notes') ?? '').trim() || null,
    is_active: formData.get('is_active') === 'on',
  };
}

export async function createProviderAction(
  _prev: ProviderFormState,
  formData: FormData,
): Promise<ProviderFormState> {
  await requireAdmin();
  const input = parseInput(formData);
  if (typeof input === 'string') return { error: input };
  const supabase = await createSupabaseServerClient();
  try {
    await upsertProvider(supabase, input);
  } catch (e) {
    return { error: (e as Error).message };
  }
  revalidatePath('/providers');
  redirect('/providers');
}

export async function updateProviderAction(
  id: string,
  _prev: ProviderFormState,
  formData: FormData,
): Promise<ProviderFormState> {
  await requireAdmin();
  const input = parseInput(formData, id);
  if (typeof input === 'string') return { error: input };
  const supabase = await createSupabaseServerClient();
  try {
    await upsertProvider(supabase, input);
  } catch (e) {
    return { error: (e as Error).message };
  }
  revalidatePath('/providers');
  revalidatePath(`/providers/${id}`);
  return { saved: true };
}

export async function deleteProviderAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get('id') ?? '').trim();
  if (!id) return;
  const supabase = await createSupabaseServerClient();
  await deleteProvider(supabase, id);
  revalidatePath('/providers');
  redirect('/providers');
}
