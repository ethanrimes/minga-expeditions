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

type RelUnit = 'second' | 'minute' | 'hour' | 'day' | 'week' | 'month' | 'year';

const REL_UNITS: { limit: number; div: number; unit: RelUnit }[] = [
  { limit: 60, div: 1, unit: 'second' },
  { limit: 3600, div: 60, unit: 'minute' },
  { limit: 86400, div: 3600, unit: 'hour' },
  { limit: 604800, div: 86400, unit: 'day' },
  { limit: 2629800, div: 604800, unit: 'week' },
  { limit: 31557600, div: 2629800, unit: 'month' },
  { limit: Number.POSITIVE_INFINITY, div: 31557600, unit: 'year' },
];

const REL_WORDS: Record<'en' | 'es', Record<RelUnit, [string, string]>> = {
  en: {
    second: ['second', 'seconds'],
    minute: ['minute', 'minutes'],
    hour: ['hour', 'hours'],
    day: ['day', 'days'],
    week: ['week', 'weeks'],
    month: ['month', 'months'],
    year: ['year', 'years'],
  },
  es: {
    second: ['segundo', 'segundos'],
    minute: ['minuto', 'minutos'],
    hour: ['hora', 'horas'],
    day: ['día', 'días'],
    week: ['semana', 'semanas'],
    month: ['mes', 'meses'],
    year: ['año', 'años'],
  },
};

// Hand-rolled because Hermes on iOS does not implement Intl.RelativeTimeFormat.
export function relativeTime(from: string | Date, locale = 'en', now: Date = new Date()): string {
  const then = typeof from === 'string' ? new Date(from) : from;
  const diffSec = Math.round((now.getTime() - then.getTime()) / 1000);
  const past = diffSec >= 0;
  const abs = Math.abs(diffSec);

  for (const { limit, div, unit } of REL_UNITS) {
    if (abs < limit) {
      const value = Math.max(1, Math.round(abs / div));
      const lang: 'en' | 'es' = locale.startsWith('es') ? 'es' : 'en';
      const [singular, plural] = REL_WORDS[lang][unit];
      const word = value === 1 ? singular : plural;
      if (lang === 'es') return past ? `hace ${value} ${word}` : `en ${value} ${word}`;
      return past ? `${value} ${word} ago` : `in ${value} ${word}`;
    }
  }
  return then.toLocaleDateString(locale);
}
