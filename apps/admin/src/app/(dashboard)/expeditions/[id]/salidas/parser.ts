// FormData → SalidaInput parser. Pure so we can unit-test without Supabase.

export interface SalidaFormValue {
  starts_at: string;          // ISO
  ends_at: string | null;     // ISO or null
  timezone: string;
  capacity: number | null;
  seats_taken: number;
  price_cents: number | null;
  currency: string | null;
  notes: string | null;
  is_published: boolean;
}

export type SalidaFormErrorKey = 'error.salida.required' | 'error.salida.invalidWindow';

export type SalidaFormParseResult =
  | { value: SalidaFormValue }
  | { errorKey: SalidaFormErrorKey };

function nullableNumber(v: FormDataEntryValue | null): number | null {
  if (v === null || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function nonNegativeInt(v: FormDataEntryValue | null): number {
  const n = Number(v ?? 0);
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : 0;
}

// <input type="datetime-local"> emits "YYYY-MM-DDTHH:mm" in local time, with no
// time zone offset. We treat it as a wall-clock value in the salida's tz and
// convert to UTC ISO before persisting.
function toIsoInZone(localValue: string, tz: string): string | null {
  if (!localValue) return null;
  // The form value is already roughly ISO, but with no offset. Append a fake Z
  // and adjust using the offset for the target zone.
  const naive = new Date(`${localValue}:00`);
  if (Number.isNaN(naive.getTime())) return null;
  const offsetMs = zoneOffsetMs(tz, naive);
  return new Date(naive.getTime() - offsetMs).toISOString();
}

// Returns the offset in ms between the given zone and UTC at the given moment.
function zoneOffsetMs(tz: string, at: Date): number {
  // Format a moment in the target tz vs UTC and diff.
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  const parts = fmt.formatToParts(at);
  const map: Record<string, string> = {};
  for (const p of parts) if (p.type !== 'literal') map[p.type] = p.value;
  const asUtc = Date.UTC(
    Number(map.year),
    Number(map.month) - 1,
    Number(map.day),
    Number(map.hour === '24' ? '00' : map.hour),
    Number(map.minute),
    Number(map.second),
  );
  return asUtc - at.getTime();
}

export function parseSalidaFormFields(formData: FormData): SalidaFormParseResult {
  const tz = String(formData.get('timezone') ?? 'America/Bogota').trim() || 'America/Bogota';
  const startsLocal = String(formData.get('starts_at') ?? '').trim();
  const endsLocal = String(formData.get('ends_at') ?? '').trim();
  const starts_at = toIsoInZone(startsLocal, tz);
  if (!starts_at) return { errorKey: 'error.salida.required' };
  const ends_at = endsLocal ? toIsoInZone(endsLocal, tz) : null;
  if (ends_at && new Date(ends_at).getTime() < new Date(starts_at).getTime()) {
    return { errorKey: 'error.salida.invalidWindow' };
  }
  const capacity = nullableNumber(formData.get('capacity'));
  const seats_taken = nonNegativeInt(formData.get('seats_taken'));
  const price_cents = nullableNumber(formData.get('price_cents'));
  const currencyRaw = String(formData.get('currency') ?? '').trim();
  const currency = currencyRaw ? currencyRaw.toUpperCase() : null;
  const notes = String(formData.get('notes') ?? '').trim() || null;
  const is_published = formData.get('is_published') === 'on';

  return {
    value: {
      starts_at,
      ends_at,
      timezone: tz,
      capacity: capacity != null && capacity > 0 ? Math.floor(capacity) : null,
      seats_taken,
      price_cents: price_cents != null && price_cents >= 0 ? Math.floor(price_cents) : null,
      currency,
      notes,
      is_published,
    },
  };
}
