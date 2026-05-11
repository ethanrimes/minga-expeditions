'use server';

import { revalidatePath } from 'next/cache';
import {
  adminListExpeditionPhotos,
  createExpeditionPhoto,
  deleteExpeditionPhoto,
  swapExpeditionPhotoOrder,
  uploadExpeditionPhoto,
} from '@minga/supabase';
import { requireAdmin } from '@/lib/auth';
import { createSupabaseServerClient } from '@/lib/supabase/server';

// Upload one or more files + insert expedition_photos rows at the end of the
// current order. Server action invoked from the multi-file <input> on the
// expedition edit page. Returns void so the <form action> typings line up;
// errors land in the server console and the page revalidates either way.
export async function addExpeditionPhotosAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const expeditionId = String(formData.get('expedition_id') ?? '');
  if (!expeditionId) return;
  const files = formData.getAll('photos').filter((f): f is File => f instanceof File && f.size > 0);
  if (files.length === 0) return;

  const supabase = await createSupabaseServerClient();
  const existing = await adminListExpeditionPhotos(supabase, expeditionId);
  let nextOrder = existing.length;
  for (const file of files) {
    try {
      const { publicUrl } = await uploadExpeditionPhoto(supabase, file, file.name);
      await createExpeditionPhoto(supabase, {
        expedition_id: expeditionId,
        url: publicUrl,
        caption: null,
        order_index: nextOrder++,
      });
    } catch (e) {
      console.warn(`Photo upload failed for ${file.name}:`, (e as Error).message);
    }
  }
  revalidatePath(`/expeditions/${expeditionId}`);
}

export async function deleteExpeditionPhotoAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get('photo_id') ?? '');
  const expeditionId = String(formData.get('expedition_id') ?? '');
  if (!id) return;
  const supabase = await createSupabaseServerClient();
  await deleteExpeditionPhoto(supabase, id);
  if (expeditionId) revalidatePath(`/expeditions/${expeditionId}`);
}

// Move a photo up or down one position in the order. `direction` is the i18n-
// neutral 'up' | 'down'. Picks the immediate neighbour and swaps order_index.
export async function moveExpeditionPhotoAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get('photo_id') ?? '');
  const expeditionId = String(formData.get('expedition_id') ?? '');
  const direction = String(formData.get('direction') ?? 'up') === 'down' ? 'down' : 'up';
  if (!id || !expeditionId) return;

  const supabase = await createSupabaseServerClient();
  const photos = await adminListExpeditionPhotos(supabase, expeditionId);
  const idx = photos.findIndex((p) => p.id === id);
  if (idx < 0) return;
  const neighbourIdx = direction === 'up' ? idx - 1 : idx + 1;
  if (neighbourIdx < 0 || neighbourIdx >= photos.length) return;

  await swapExpeditionPhotoOrder(
    supabase,
    { id: photos[idx].id, order_index: photos[idx].order_index },
    { id: photos[neighbourIdx].id, order_index: photos[neighbourIdx].order_index },
  );
  revalidatePath(`/expeditions/${expeditionId}`);
}
