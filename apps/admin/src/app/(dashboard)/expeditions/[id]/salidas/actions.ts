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

// ---------- series ---------------------------------------------------------

export type SeriesFormState = { error?: string; created?: number };

type Frequency = 'daily' | 'weekly' | 'monthly';

function materializeOccurrences(
  startsAt: Date,
  endsAt: Date | null,
  freq: Frequency,
  interval: number,
  byWeekday: number[],
  until: Date | null,
): Array<{ starts_at: string; ends_at: string | null }> {
  const out: Array<{ starts_at: string; ends_at: string | null }> = [];
  const duration = endsAt ? endsAt.getTime() - startsAt.getTime() : 0;
  // Hard cap at 200 occurrences regardless of inputs — avoid runaway loops.
  const HARD_CAP = 200;
  const hardUntil = until ?? new Date(startsAt.getTime() + 365 * 86400_000);

  if (freq === 'daily') {
    let cursor = new Date(startsAt);
    while (cursor <= hardUntil && out.length < HARD_CAP) {
      out.push({
        starts_at: cursor.toISOString(),
        ends_at: endsAt ? new Date(cursor.getTime() + duration).toISOString() : null,
      });
      cursor = new Date(cursor.getTime() + interval * 86400_000);
    }
  } else if (freq === 'weekly') {
    // If no by_weekday provided, default to the weekday of starts_at.
    const days = byWeekday.length > 0 ? byWeekday.slice().sort((a, b) => a - b) : [startsAt.getDay()];
    let weekStart = new Date(startsAt);
    weekStart.setHours(startsAt.getHours(), startsAt.getMinutes(), 0, 0);
    // Move weekStart back to the Sunday of the first week, then iterate weeks.
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    while (weekStart <= hardUntil && out.length < HARD_CAP) {
      for (const dow of days) {
        if (out.length >= HARD_CAP) break;
        const occ = new Date(weekStart);
        occ.setDate(weekStart.getDate() + dow);
        occ.setHours(startsAt.getHours(), startsAt.getMinutes(), startsAt.getSeconds(), 0);
        if (occ < startsAt) continue;
        if (occ > hardUntil) break;
        out.push({
          starts_at: occ.toISOString(),
          ends_at: endsAt ? new Date(occ.getTime() + duration).toISOString() : null,
        });
      }
      weekStart = new Date(weekStart.getTime() + interval * 7 * 86400_000);
    }
  } else {
    // monthly: same day-of-month as starts_at, every `interval` months.
    let cursor = new Date(startsAt);
    while (cursor <= hardUntil && out.length < HARD_CAP) {
      out.push({
        starts_at: cursor.toISOString(),
        ends_at: endsAt ? new Date(cursor.getTime() + duration).toISOString() : null,
      });
      const next = new Date(cursor);
      next.setMonth(next.getMonth() + interval);
      cursor = next;
    }
  }
  return out;
}

export async function createSalidaSeriesAction(
  expeditionId: string,
  _prev: SeriesFormState,
  formData: FormData,
): Promise<SeriesFormState> {
  await requireAdmin();
  const frequency = String(formData.get('frequency') ?? 'weekly') as Frequency;
  const interval = Math.max(1, Number(formData.get('interval_count') ?? 1));
  const startsAtStr = String(formData.get('starts_at') ?? '').trim();
  const endsAtStr = String(formData.get('ends_at') ?? '').trim();
  const seriesUntilStr = String(formData.get('series_until') ?? '').trim();
  const timezone = String(formData.get('timezone') ?? 'America/Bogota');
  const capacityRaw = String(formData.get('capacity') ?? '').trim();
  const priceRaw = String(formData.get('price_cents') ?? '').trim();
  const currency = String(formData.get('currency') ?? '').trim() || null;
  const notes = String(formData.get('notes') ?? '').trim() || null;
  const isPublished = formData.get('is_published') === 'on';
  const byWeekday = formData
    .getAll('by_weekday')
    .map((v) => Number(v))
    .filter((n) => Number.isFinite(n) && n >= 0 && n <= 6);

  if (!startsAtStr) return { error: 'starts_at is required' };
  const startsAt = new Date(startsAtStr);
  if (Number.isNaN(startsAt.getTime())) return { error: 'starts_at is invalid' };
  const endsAt = endsAtStr ? new Date(endsAtStr) : null;
  if (endsAt && Number.isNaN(endsAt.getTime())) return { error: 'ends_at is invalid' };
  const seriesUntil = seriesUntilStr ? new Date(seriesUntilStr) : null;
  if (seriesUntil && Number.isNaN(seriesUntil.getTime()))
    return { error: 'series_until is invalid' };

  const capacity = capacityRaw ? Math.max(1, Number(capacityRaw)) : null;
  const price = priceRaw ? Math.max(1, Number(priceRaw)) : null;

  const occurrences = materializeOccurrences(
    startsAt,
    endsAt,
    frequency,
    interval,
    byWeekday,
    seriesUntil,
  );
  if (occurrences.length === 0) return { error: 'Recurrence produced no occurrences' };

  const supabase = await createSupabaseServerClient();

  const { data: series, error: serErr } = await supabase
    .from('salida_series')
    .insert({
      expedition_id: expeditionId,
      frequency,
      interval_count: interval,
      by_weekday: byWeekday,
      series_until: seriesUntil ? seriesUntil.toISOString().slice(0, 10) : null,
      starts_at: startsAt.toISOString(),
      ends_at: endsAt ? endsAt.toISOString() : null,
      timezone,
      capacity,
      price_cents: price,
      currency,
      notes,
      is_published: isPublished,
    })
    .select('id')
    .single();
  if (serErr || !series) return { error: serErr?.message ?? 'Could not create series' };

  const rows = occurrences.map((occ) => ({
    expedition_id: expeditionId,
    series_id: (series as { id: string }).id,
    starts_at: occ.starts_at,
    ends_at: occ.ends_at,
    timezone,
    capacity,
    price_cents: price,
    currency,
    notes,
    is_published: isPublished,
  }));
  const { error: occErr } = await supabase.from('expedition_salidas').insert(rows);
  if (occErr) return { error: `Series created but occurrences failed: ${occErr.message}` };

  revalidatePath(`/expeditions/${expeditionId}/salidas`);
  revalidatePath('/expeditions/calendar');
  return { created: rows.length };
}

// Delete the whole series + every salida row that belongs to it.
export async function deleteSalidaSeriesAction(formData: FormData) {
  await requireAdmin();
  const seriesId = String(formData.get('series_id') ?? '');
  const expeditionId = String(formData.get('expedition_id') ?? '');
  if (!seriesId) return;
  const supabase = await createSupabaseServerClient();
  await supabase.from('expedition_salidas').delete().eq('series_id', seriesId);
  await supabase.from('salida_series').delete().eq('id', seriesId);
  if (expeditionId) revalidatePath(`/expeditions/${expeditionId}/salidas`);
  revalidatePath('/expeditions/calendar');
}
