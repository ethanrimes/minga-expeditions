import type { DbExpedition, DbExpeditionSalida } from '@minga/types';

export function isUpcoming(salida: Pick<DbExpeditionSalida, 'starts_at'>, now: Date = new Date()): boolean {
  return new Date(salida.starts_at).getTime() >= now.getTime();
}

export function nextSalida<T extends Pick<DbExpeditionSalida, 'starts_at' | 'is_published'>>(
  salidas: T[],
  now: Date = new Date(),
): T | null {
  const upcoming = salidas
    .filter((s) => s.is_published && new Date(s.starts_at).getTime() >= now.getTime())
    .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime());
  return upcoming[0] ?? null;
}

export function priceCentsForSalida(
  salida: Pick<DbExpeditionSalida, 'price_cents' | 'currency'>,
  expedition: Pick<DbExpedition, 'price_cents' | 'currency'>,
): { price_cents: number; currency: string } {
  return {
    price_cents: salida.price_cents ?? expedition.price_cents,
    currency: salida.currency ?? expedition.currency,
  };
}

export function seatsRemaining(
  salida: Pick<DbExpeditionSalida, 'capacity' | 'seats_taken'>,
): number | null {
  if (salida.capacity == null) return null;
  return Math.max(0, salida.capacity - salida.seats_taken);
}

export function isSoldOut(salida: Pick<DbExpeditionSalida, 'capacity' | 'seats_taken'>): boolean {
  return salida.capacity != null && salida.seats_taken >= salida.capacity;
}

// Bucket salidas by their starts_at calendar date (YYYY-MM-DD in the given
// time zone). Used by the calendar grid to find which days have departures.
export function groupSalidasByDay<T extends Pick<DbExpeditionSalida, 'starts_at' | 'timezone'>>(
  salidas: T[],
  fallbackTz = 'America/Bogota',
): Map<string, T[]> {
  const out = new Map<string, T[]>();
  for (const s of salidas) {
    const tz = s.timezone ?? fallbackTz;
    const key = dayKey(s.starts_at, tz);
    const arr = out.get(key);
    if (arr) arr.push(s);
    else out.set(key, [s]);
  }
  return out;
}

export function dayKey(iso: string, tz = 'America/Bogota'): string {
  const d = new Date(iso);
  // toLocaleDateString with en-CA → YYYY-MM-DD.
  return d.toLocaleDateString('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' });
}

export function formatSalidaDate(
  starts_at: string,
  opts: { locale?: string; tz?: string; withTime?: boolean } = {},
): string {
  const locale = opts.locale ?? 'es-CO';
  const tz = opts.tz ?? 'America/Bogota';
  const d = new Date(starts_at);
  if (opts.withTime) {
    return d.toLocaleString(locale, {
      timeZone: tz,
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
  return d.toLocaleDateString(locale, {
    timeZone: tz,
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatSalidaRange(
  starts_at: string,
  ends_at: string | null,
  opts: { locale?: string; tz?: string } = {},
): string {
  const start = formatSalidaDate(starts_at, opts);
  if (!ends_at) return start;
  const end = formatSalidaDate(ends_at, opts);
  if (start === end) return start;
  return `${start} – ${end}`;
}
