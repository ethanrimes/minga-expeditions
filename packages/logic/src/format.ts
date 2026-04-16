export function formatDistanceKm(km: number, locale = 'en-US'): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toLocaleString(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} km`;
}

export function formatElevation(m: number): string {
  return `${Math.round(m).toLocaleString()} m`;
}

export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}h ${m.toString().padStart(2, '0')}m`;
  if (m > 0) return `${m}m ${s.toString().padStart(2, '0')}s`;
  return `${s}s`;
}

export function formatPace(distanceKm: number, durationSeconds: number): string {
  if (distanceKm <= 0) return '—';
  const secPerKm = durationSeconds / distanceKm;
  const m = Math.floor(secPerKm / 60);
  const s = Math.round(secPerKm % 60);
  return `${m}:${s.toString().padStart(2, '0')} /km`;
}

export function formatSpeedKmh(distanceKm: number, durationSeconds: number): string {
  if (durationSeconds <= 0) return '—';
  const kmh = distanceKm / (durationSeconds / 3600);
  return `${kmh.toFixed(1)} km/h`;
}

export interface FormatPriceOpts {
  currency?: string;
  locale?: string;
  // Callers pass their translated "Free" label so this function stays pure.
  freeLabel?: string;
}

export function formatPriceCents(cents: number, opts: FormatPriceOpts | string = {}, maybeLocale?: string): string {
  // Back-compat: older callers used (cents, currency, locale). Detect that form.
  const o: FormatPriceOpts =
    typeof opts === 'string' ? { currency: opts, locale: maybeLocale } : opts;
  const currency = o.currency ?? 'COP';
  const locale = o.locale ?? 'es-CO';
  const freeLabel = o.freeLabel ?? 'Free';
  if (cents === 0) return freeLabel;
  const amount = cents / 100;
  try {
    return new Intl.NumberFormat(locale, { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount);
  } catch {
    return `${amount} ${currency}`;
  }
}

export function relativeTime(from: string | Date, locale = 'en', now: Date = new Date()): string {
  const then = typeof from === 'string' ? new Date(from) : from;
  const diffSec = Math.round((now.getTime() - then.getTime()) / 1000);
  const abs = Math.abs(diffSec);
  const units: [number, Intl.RelativeTimeFormatUnit][] = [
    [60, 'second'],
    [3600, 'minute'],
    [86400, 'hour'],
    [604800, 'day'],
    [2629800, 'week'],
    [31557600, 'month'],
    [Number.POSITIVE_INFINITY, 'year'],
  ];
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  let prev = 1;
  for (const [limit, unit] of units) {
    if (abs < limit) {
      const value = Math.round(-diffSec / prev);
      return rtf.format(value, unit);
    }
    prev = limit;
  }
  return then.toLocaleDateString(locale);
}
