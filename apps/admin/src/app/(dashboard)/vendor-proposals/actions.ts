'use server';

import { revalidatePath } from 'next/cache';
import type { ProposalStatus } from '@minga/types';
import { updateVendorProposal } from '@minga/supabase';
import { requireAdmin } from '@/lib/auth';
import { createSupabaseServerClient } from '@/lib/supabase/server';

const VALID_STATUSES: ProposalStatus[] = ['new', 'reviewing', 'accepted', 'rejected', 'archived'];

export async function updateProposalStatus(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get('id') ?? '');
  const status = String(formData.get('status') ?? '') as ProposalStatus;
  if (!id || !VALID_STATUSES.includes(status)) return;

  const supabase = await createSupabaseServerClient();
  await updateVendorProposal(supabase, id, { status });
  revalidatePath('/vendor-proposals');
  revalidatePath(`/vendor-proposals/${id}`);
}

export async function updateProposalNotes(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get('id') ?? '');
  const admin_notes = String(formData.get('admin_notes') ?? '').trim() || null;
  if (!id) return;

  const supabase = await createSupabaseServerClient();
  await updateVendorProposal(supabase, id, { admin_notes });
  revalidatePath(`/vendor-proposals/${id}`);
}
