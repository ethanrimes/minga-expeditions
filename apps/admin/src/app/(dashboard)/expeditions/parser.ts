// Pure FormData → ExpeditionInput converter, separated from actions.ts so we
// can unit-test all the field coercion + validation rules without booting the
// Supabase server-side helpers.

import type { TerrainTag } from '@minga/types';

const TERRAIN_TAGS = [
  'mountain',
  'flat',
  'desert',
  'river',
  'forest',
  'coast',
  'urban',
  'jungle',
  'snow',
] as const satisfies readonly TerrainTag[];

export interface ExpeditionFormValue {
  title: string;
  description: string;
  category_id: string;
  location_name: string;
  region: string | null;
  country: string;
  start_lat: number | null;
  start_lng: number | null;
  distance_km: number | null;
  elevation_gain_m: number | null;
  difficulty: 1 | 2 | 3 | 4 | 5;
  price_cents: number;
  currency: string;
  is_official: boolean;
  is_published: boolean;
  terrain_tags: TerrainTag[];
}

// Errors are returned as i18n keys so the server action can translate them in
// the caller's locale. Tests assert on keys to stay locale-agnostic.
export type ExpeditionFormErrorKey = 'error.expedition.required';

export type ExpeditionFormParseResult =
  | { value: ExpeditionFormValue }
  | { errorKey: ExpeditionFormErrorKey };

function num(v: FormDataEntryValue | null): number | null {
  if (v === null || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function clampDifficulty(v: number): 1 | 2 | 3 | 4 | 5 {
  const i = Math.round(v);
  if (i < 1) return 1;
  if (i > 5) return 5;
  return i as 1 | 2 | 3 | 4 | 5;
}

export function parseExpeditionFormFields(formData: FormData): ExpeditionFormParseResult {
  const title = String(formData.get('title') ?? '').trim();
  const description = String(formData.get('description') ?? '').trim();
  const category_id = String(formData.get('category_id') ?? '');
  const location_name = String(formData.get('location_name') ?? '').trim();
  const region = String(formData.get('region') ?? '').trim() || null;
  const country = String(formData.get('country') ?? '').trim() || 'Colombia';
  const start_lat = num(formData.get('start_lat'));
  const start_lng = num(formData.get('start_lng'));
  const distance_km = num(formData.get('distance_km'));
  const elevation_gain_m = num(formData.get('elevation_gain_m'));
  const difficultyRaw = Number(formData.get('difficulty') ?? 3);
  const difficulty = clampDifficulty(Number.isFinite(difficultyRaw) ? difficultyRaw : 3);
  const price_cents = Math.max(0, Number(formData.get('price_cents') ?? 0) || 0);
  const currency = (String(formData.get('currency') ?? 'COP').trim() || 'COP').toUpperCase();
  const is_official = formData.get('is_official') === 'on';
  const is_published = formData.get('is_published') === 'on';
  const terrain_tags = (formData.getAll('terrain_tags') as string[])
    .map((v) => v.trim())
    .filter((v): v is TerrainTag => (TERRAIN_TAGS as readonly string[]).includes(v));

  if (!title || !description || !category_id || !location_name) {
    return { errorKey: 'error.expedition.required' };
  }

  return {
    value: {
      title,
      description,
      category_id,
      location_name,
      region,
      country,
      start_lat,
      start_lng,
      distance_km,
      elevation_gain_m,
      difficulty,
      price_cents,
      currency,
      is_official,
      is_published,
      terrain_tags,
    },
  };
}
