'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { DbCategory, SalidaWithExpedition } from '@minga/types';
import { dayKey, formatSalidaDate, isSoldOut } from '@minga/logic';

interface Labels {
  prev: string;
  next: string;
  today: string;
  empty: string;
  filtersTitle: string;
  category: string;
  region: string;
  difficulty: string;
  price: string;
  all: string;
  free: string;
  paid: string;
  reset: string;
  legendPublished: string;
  legendDraft: string;
  legendSoldOut: string;
}

interface Props {
  salidas: SalidaWithExpedition[];
  categories: DbCategory[];
  locale: 'en' | 'es';
  labels: Labels;
}

type PriceBand = 'all' | 'free' | 'paid';

interface Filters {
  categoryId: string;
  region: string;
  difficulty: string;
  price: PriceBand;
}

const EMPTY_FILTERS: Filters = { categoryId: '', region: '', difficulty: '', price: 'all' };

const WEEKDAYS_ES = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const WEEKDAYS_EN = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function endOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}
function addMonths(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth() + n, 1);
}
// Build the 6×7 cell grid (max 42 days) starting on Monday for the given month.
function monthGridDays(month: Date): Date[] {
  const first = startOfMonth(month);
  const dayOfWeek = (first.getDay() + 6) % 7; // 0 = Monday
  const start = new Date(first);
  start.setDate(first.getDate() - dayOfWeek);
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}

function effectivePriceCents(s: SalidaWithExpedition): number {
  return s.price_cents ?? s.expedition.price_cents;
}

export function CalendarClient({ salidas, categories, locale, labels }: Props) {
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [cursor, setCursor] = useState<Date>(startOfMonth(new Date()));

  const regions = useMemo(() => {
    const set = new Set<string>();
    for (const s of salidas) if (s.expedition.region) set.add(s.expedition.region);
    return Array.from(set).sort();
  }, [salidas]);

  const filtered = useMemo(() => {
    return salidas.filter((s) => {
      if (filters.categoryId && s.expedition.category_id !== filters.categoryId) return false;
      if (filters.region && s.expedition.region !== filters.region) return false;
      if (filters.difficulty && String(s.expedition.difficulty) !== filters.difficulty) return false;
      const price = effectivePriceCents(s);
      if (filters.price === 'free' && price > 0) return false;
      if (filters.price === 'paid' && price <= 0) return false;
      return true;
    });
  }, [salidas, filters]);

  const dayBuckets = useMemo(() => {
    const map = new Map<string, SalidaWithExpedition[]>();
    for (const s of filtered) {
      const key = dayKey(s.starts_at, s.timezone);
      const arr = map.get(key);
      if (arr) arr.push(s);
      else map.set(key, [s]);
    }
    return map;
  }, [filtered]);

  const days = monthGridDays(cursor);
  const monthStart = startOfMonth(cursor);
  const monthEnd = endOfMonth(cursor);
  const monthLabel = cursor.toLocaleDateString(locale === 'es' ? 'es-CO' : 'en-US', {
    month: 'long',
    year: 'numeric',
  });
  const weekdays = locale === 'es' ? WEEKDAYS_ES : WEEKDAYS_EN;

  const reset = () => setFilters(EMPTY_FILTERS);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
      <aside className="card flex flex-col gap-4 h-fit">
        <h3 className="font-semibold">{labels.filtersTitle}</h3>

        <label className="field">
          <span className="field-label">{labels.category}</span>
          <select
            value={filters.categoryId}
            onChange={(e) => setFilters((f) => ({ ...f, categoryId: e.target.value }))}
            className="field-input"
          >
            <option value="">{labels.all}</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {locale === 'es' ? c.name_es : c.name_en}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span className="field-label">{labels.region}</span>
          <select
            value={filters.region}
            onChange={(e) => setFilters((f) => ({ ...f, region: e.target.value }))}
            className="field-input"
          >
            <option value="">{labels.all}</option>
            {regions.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </label>

        <label className="field">
          <span className="field-label">{labels.difficulty}</span>
          <select
            value={filters.difficulty}
            onChange={(e) => setFilters((f) => ({ ...f, difficulty: e.target.value }))}
            className="field-input"
          >
            <option value="">{labels.all}</option>
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>
                {'●'.repeat(n) + '○'.repeat(5 - n)}
              </option>
            ))}
          </select>
        </label>

        <fieldset className="field">
          <span className="field-label">{labels.price}</span>
          <div className="flex flex-wrap gap-2">
            {([
              ['all', labels.all],
              ['free', labels.free],
              ['paid', labels.paid],
            ] as [PriceBand, string][]).map(([value, label]) => {
              const active = filters.price === value;
              return (
                <button
                  type="button"
                  key={value}
                  onClick={() => setFilters((f) => ({ ...f, price: value }))}
                  className={
                    active
                      ? 'inline-flex items-center rounded-full bg-primary text-primary-fg px-3 py-1 text-xs font-semibold'
                      : 'inline-flex items-center rounded-full border border-surface-border bg-surface px-3 py-1 text-xs'
                  }
                >
                  {label}
                </button>
              );
            })}
          </div>
        </fieldset>

        <button type="button" className="btn-secondary text-xs mt-2" onClick={reset}>
          {labels.reset}
        </button>

        <div className="border-t border-surface-border pt-4 flex flex-col gap-2 text-xs">
          <LegendDot color="#1F8A4C" label={labels.legendPublished} />
          <LegendDot color="#9AA1AE" label={labels.legendDraft} />
          <LegendDot color="#D14343" label={labels.legendSoldOut} />
        </div>
      </aside>

      <section className="card flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <h2 className="text-lg font-semibold capitalize">{monthLabel}</h2>
          <div className="inline-flex gap-2 items-center">
            <button type="button" className="btn-secondary text-xs" onClick={() => setCursor(addMonths(cursor, -1))}>
              <ChevronLeft size={14} /> {labels.prev}
            </button>
            <button
              type="button"
              className="btn-secondary text-xs"
              onClick={() => setCursor(startOfMonth(new Date()))}
            >
              {labels.today}
            </button>
            <button type="button" className="btn-secondary text-xs" onClick={() => setCursor(addMonths(cursor, 1))}>
              {labels.next} <ChevronRight size={14} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 text-xs text-ink-500">
          {weekdays.map((w) => (
            <div key={w} className="px-2 py-1 font-semibold uppercase tracking-wide">
              {w}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {days.map((d) => {
            const key = dayKey(d.toISOString(), 'America/Bogota');
            const inMonth = d >= monthStart && d <= monthEnd;
            const items = dayBuckets.get(key) ?? [];
            return (
              <div
                key={key + d.getTime()}
                className={
                  'min-h-[110px] rounded-md border p-1 flex flex-col gap-1 ' +
                  (inMonth ? 'bg-surface border-surface-border' : 'bg-surface-alt border-transparent opacity-60')
                }
              >
                <div className="text-xs text-ink-500">{d.getDate()}</div>
                {items.slice(0, 3).map((s) => (
                  <SalidaPill key={s.id} salida={s} locale={locale} />
                ))}
                {items.length > 3 ? (
                  <div className="text-[10px] text-ink-500">+{items.length - 3}</div>
                ) : null}
              </div>
            );
          })}
        </div>

        {filtered.length === 0 ? (
          <p className="text-sm text-ink-500 mt-3">{labels.empty}</p>
        ) : null}
      </section>
    </div>
  );
}

function SalidaPill({ salida, locale }: { salida: SalidaWithExpedition; locale: 'en' | 'es' }) {
  const tone = !salida.is_published
    ? 'bg-ink-300/20 text-ink-700 border-ink-300/40'
    : isSoldOut(salida)
      ? 'bg-danger/15 text-danger border-danger/40'
      : 'bg-success/15 text-success border-success/40';
  const t = formatSalidaDate(salida.starts_at, {
    locale: locale === 'es' ? 'es-CO' : 'en-US',
    tz: salida.timezone,
    withTime: true,
  });
  // Title is just the expedition title — keep it terse for cell width.
  return (
    <Link
      href={`/expeditions/${salida.expedition.id}/salidas/${salida.id}`}
      className={`block rounded border px-1.5 py-1 text-[11px] leading-tight ${tone} truncate`}
      title={`${salida.expedition.title}\n${t}`}
    >
      <div className="font-semibold truncate">{salida.expedition.title}</div>
    </Link>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span
        className="inline-block w-2.5 h-2.5 rounded-full"
        style={{ background: color }}
      />
      <span>{label}</span>
    </div>
  );
}
