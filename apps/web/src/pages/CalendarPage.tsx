import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, ChevronLeft, ChevronRight, SlidersHorizontal } from 'lucide-react';
import { useTheme } from '@minga/theme';
import { useT } from '@minga/i18n';
import {
  fetchCategories,
  fetchSalidasInRange,
  type CalendarSalidaFilters,
} from '@minga/supabase';
import {
  dayKey,
  formatSalidaDate,
  formatSalidaRange,
  isSoldOut,
  priceCentsForSalida,
  formatPriceCents,
} from '@minga/logic';
import type { DbCategory, SalidaWithExpedition } from '@minga/types';
import { supabase } from '../supabase';
import {
  CalendarFilterModal,
  emptyCalendarFilter,
  countActiveFilters,
  type CalendarFilterState,
  type CalendarViewMode,
} from '../components/CalendarFilterModal';

const PRICE_CEILING_FALLBACK = 2_000_000_00;

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function endOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}
function addMonths(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth() + n, 1);
}
function monthGrid(month: Date): Date[] {
  const first = startOfMonth(month);
  const dayOfWeek = (first.getDay() + 6) % 7;
  const start = new Date(first);
  start.setDate(first.getDate() - dayOfWeek);
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}

export function CalendarPage() {
  const { theme } = useTheme();
  const { t, language } = useT();
  const [salidas, setSalidas] = useState<SalidaWithExpedition[]>([]);
  const [categories, setCategories] = useState<DbCategory[]>([]);
  const [cursor, setCursor] = useState<Date>(startOfMonth(new Date()));
  const [error, setError] = useState<string | null>(null);
  const [priceCeiling, setPriceCeiling] = useState(PRICE_CEILING_FALLBACK);
  const [filters, setFilters] = useState<CalendarFilterState>(() =>
    emptyCalendarFilter(PRICE_CEILING_FALLBACK),
  );
  const [view, setView] = useState<CalendarViewMode>('grid');
  const [filterOpen, setFilterOpen] = useState(false);

  const dateLocale = language === 'es' ? 'es-CO' : 'en-US';

  useEffect(() => {
    let cancelled = false;
    const from = new Date();
    from.setMonth(from.getMonth() - 1, 1);
    const to = new Date();
    to.setMonth(to.getMonth() + 12, 0);
    const apiFilters: CalendarSalidaFilters = {
      categoryIds: filters.categoryIds,
      regions: filters.regions,
      terrainTags: filters.terrainTags,
      difficulty: filters.difficulty,
      minPriceCents: filters.priceMinCents > 0 ? filters.priceMinCents : null,
      maxPriceCents: filters.priceMaxCents < priceCeiling ? filters.priceMaxCents : null,
      minRating: filters.minRating > 0 ? filters.minRating : null,
    };
    Promise.all([
      fetchSalidasInRange(supabase, from.toISOString(), to.toISOString(), apiFilters),
      fetchCategories(supabase, { activeOnly: true }),
    ])
      .then(([sals, cats]) => {
        if (cancelled) return;
        setSalidas(sals);
        setCategories(cats);
      })
      .catch((e: any) => !cancelled && setError(e?.message ?? t('common.loadError')));
    return () => {
      cancelled = true;
    };
  }, [filters, priceCeiling]);

  // Adjust the slider ceiling once we see the data — same trick as mobile.
  useEffect(() => {
    if (salidas.length === 0) return;
    const maxSeen = salidas.reduce((m, s) => {
      const p = s.price_cents ?? s.expedition.price_cents;
      return p > m ? p : m;
    }, 0);
    if (maxSeen <= 0) return;
    const next = Math.ceil(maxSeen / 100_000_00) * 100_000_00;
    if (next > priceCeiling) {
      setPriceCeiling(next);
      setFilters((f) => (f.priceMaxCents === priceCeiling ? { ...f, priceMaxCents: next } : f));
    }
  }, [salidas, priceCeiling]);

  const regions = useMemo(() => {
    const set = new Set<string>();
    for (const s of salidas) if (s.expedition.region) set.add(s.expedition.region);
    return Array.from(set).sort();
  }, [salidas]);

  const buckets = useMemo(() => {
    const map = new Map<string, SalidaWithExpedition[]>();
    for (const s of salidas) {
      const k = dayKey(s.starts_at, s.timezone);
      const arr = map.get(k);
      if (arr) arr.push(s);
      else map.set(k, [s]);
    }
    return map;
  }, [salidas]);

  const monthLabel = cursor.toLocaleDateString(dateLocale, { month: 'long', year: 'numeric' });
  const days = monthGrid(cursor);
  const monthStart = startOfMonth(cursor);
  const monthEnd = endOfMonth(cursor);
  const weekdays = language === 'es'
    ? ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
    : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const activeCount = countActiveFilters(filters, priceCeiling);
  const currency = salidas[0]?.expedition.currency ?? salidas[0]?.currency ?? 'COP';

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div>
          <h1
            style={{
              color: theme.text,
              fontSize: 40,
              fontWeight: 800,
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <CalendarDays size={32} strokeWidth={2.2} /> {t('cal.title')}
          </h1>
          <p style={{ color: theme.textMuted, margin: '6px 0 0' }}>{t('cal.subtitle')}</p>
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <ViewToggle theme={theme} view={view} onChange={setView} t={t} />
          <button
            type="button"
            data-testid="calendar-filter-open"
            onClick={() => setFilterOpen(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: activeCount > 0 ? theme.primary : theme.surface,
              color: activeCount > 0 ? theme.onPrimary : theme.text,
              border: `1px solid ${activeCount > 0 ? theme.primary : theme.border}`,
              borderRadius: 999,
              padding: '10px 18px',
              fontWeight: 700,
              fontSize: 14,
              cursor: 'pointer',
            }}
          >
            <SlidersHorizontal size={16} strokeWidth={2.2} />
            {t('cal.filters.open')}
            {activeCount > 0
              ? `  ·  ${t('cal.filters.activeCount').replace('{n}', String(activeCount))}`
              : ''}
          </button>
        </div>
      </div>

      {error ? <div style={{ color: theme.danger, marginTop: 12 }}>{error}</div> : null}

      <section
        style={{
          marginTop: 24,
          background: theme.surface,
          border: `1px solid ${theme.border}`,
          borderRadius: 16,
          padding: 16,
        }}
      >
        {view === 'grid' ? (
          <>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 12,
              }}
            >
              <h2 style={{ color: theme.text, margin: 0, textTransform: 'capitalize' }}>{monthLabel}</h2>
              <div style={{ display: 'flex', gap: 8 }}>
                <NavBtn theme={theme} onClick={() => setCursor(addMonths(cursor, -1))}>
                  <ChevronLeft size={14} /> {t('cal.prev')}
                </NavBtn>
                <NavBtn theme={theme} onClick={() => setCursor(startOfMonth(new Date()))}>
                  {t('cal.today')}
                </NavBtn>
                <NavBtn theme={theme} onClick={() => setCursor(addMonths(cursor, 1))}>
                  {t('cal.next')} <ChevronRight size={14} />
                </NavBtn>
              </div>
            </div>

            <div
              data-testid="calendar-grid"
              style={{
                display: 'grid',
                // minmax(0, 1fr) prevents long expedition titles inside a cell
                // from blowing out the column width — otherwise a `nowrap` link
                // takes its min-content from the longest token and the grid
                // grows the column to fit.
                gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
                gap: 4,
              }}
            >
              {weekdays.map((w) => (
                <div
                  key={w}
                  style={{
                    padding: '6px 4px',
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: 0.4,
                    textTransform: 'uppercase',
                    color: theme.textMuted,
                    minWidth: 0,
                  }}
                >
                  {w}
                </div>
              ))}
              {days.map((d) => {
                const inMonth = d >= monthStart && d <= monthEnd;
                const key = dayKey(d.toISOString());
                const items = buckets.get(key) ?? [];
                return (
                  <div
                    key={`${key}-${d.getTime()}`}
                    style={{
                      minHeight: 96,
                      minWidth: 0,
                      background: inMonth ? theme.surface : theme.surfaceAlt,
                      border: `1px solid ${inMonth ? theme.border : 'transparent'}`,
                      borderRadius: 8,
                      padding: 6,
                      opacity: inMonth ? 1 : 0.5,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 4,
                      overflow: 'hidden',
                    }}
                  >
                    <div style={{ color: theme.textMuted, fontSize: 11 }}>{d.getDate()}</div>
                    {items.slice(0, 3).map((s) => {
                      const sold = isSoldOut(s);
                      return (
                        <Link
                          key={s.id}
                          to={`/expeditions/${s.expedition.id}?salida=${s.id}`}
                          data-testid={`cal-salida-${s.id}`}
                          title={`${s.expedition.title}\n${formatSalidaDate(s.starts_at, { locale: dateLocale, tz: s.timezone, withTime: true })}`}
                          style={{
                            display: 'block',
                            background: sold ? theme.danger : theme.primary,
                            color: '#fff',
                            padding: '2px 6px',
                            borderRadius: 4,
                            fontSize: 10,
                            fontWeight: 700,
                            textDecoration: 'none',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            minWidth: 0,
                          }}
                        >
                          {s.expedition.title}
                        </Link>
                      );
                    })}
                    {items.length > 3 ? (
                      <div style={{ color: theme.textMuted, fontSize: 10 }}>+{items.length - 3}</div>
                    ) : null}
                  </div>
                );
              })}
            </div>

            {salidas.length === 0 ? (
              <p style={{ color: theme.textMuted, marginTop: 16 }}>{t('cal.empty')}</p>
            ) : null}
          </>
        ) : (
          <AgendaList
            salidas={salidas}
            dateLocale={dateLocale}
            theme={theme}
            t={t}
            emptyLabel={t('cal.empty')}
          />
        )}

        <h3 style={{ color: theme.text, marginTop: 24 }}>{t('salida.upcomingHeading')}</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {salidas
            .filter((s) => new Date(s.starts_at).getTime() >= Date.now())
            .slice(0, 8)
            .map((s) => {
              const sold = isSoldOut(s);
              const { price_cents, currency: salidaCurrency } = priceCentsForSalida(s, s.expedition);
              return (
                <Link
                  key={s.id}
                  to={`/expeditions/${s.expedition.id}?salida=${s.id}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 16,
                    padding: 12,
                    background: theme.surfaceAlt,
                    borderRadius: 12,
                    textDecoration: 'none',
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ color: theme.text, fontWeight: 700 }}>{s.expedition.title}</div>
                    <div style={{ color: theme.textMuted, fontSize: 12, marginTop: 2 }}>
                      {formatSalidaRange(s.starts_at, s.ends_at, { locale: dateLocale, tz: s.timezone })}
                      {' · '}
                      {sold ? t('salida.soldOut') : formatPriceCents(price_cents, { currency: salidaCurrency, freeLabel: t('common.free') })}
                    </div>
                  </div>
                </Link>
              );
            })}
        </div>
      </section>

      <CalendarFilterModal
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        value={filters}
        onChange={setFilters}
        categories={categories}
        regions={regions}
        priceCeilingCents={priceCeiling}
        currency={currency}
      />
    </div>
  );
}

function AgendaList({
  salidas,
  dateLocale,
  theme,
  t,
  emptyLabel,
}: {
  salidas: SalidaWithExpedition[];
  dateLocale: string;
  theme: ReturnType<typeof useTheme>['theme'];
  t: (k: any) => string;
  emptyLabel: string;
}) {
  if (salidas.length === 0) {
    return <p style={{ color: theme.textMuted }}>{emptyLabel}</p>;
  }
  const groups = new Map<string, SalidaWithExpedition[]>();
  for (const s of salidas) {
    const k = formatSalidaDate(s.starts_at, { locale: dateLocale, tz: s.timezone });
    const arr = groups.get(k);
    if (arr) arr.push(s);
    else groups.set(k, [s]);
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {Array.from(groups.entries()).map(([day, list]) => (
        <div key={day} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ color: theme.text, fontWeight: 700 }}>{day}</div>
          {list.map((s) => {
            const sold = isSoldOut(s);
            const { price_cents, currency } = priceCentsForSalida(s, s.expedition);
            return (
              <Link
                key={s.id}
                to={`/expeditions/${s.expedition.id}?salida=${s.id}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: 12,
                  background: theme.surfaceAlt,
                  borderRadius: 12,
                  textDecoration: 'none',
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ color: theme.text, fontWeight: 700 }}>{s.expedition.title}</div>
                  <div style={{ color: theme.textMuted, fontSize: 12, marginTop: 2 }}>
                    {formatSalidaRange(s.starts_at, s.ends_at, { locale: dateLocale, tz: s.timezone })}
                    {' · '}
                    {sold ? t('salida.soldOut') : formatPriceCents(price_cents, { currency, freeLabel: t('common.free') })}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      ))}
    </div>
  );
}

function ViewToggle({
  theme,
  view,
  onChange,
  t,
}: {
  theme: ReturnType<typeof useTheme>['theme'];
  view: CalendarViewMode;
  onChange: (v: CalendarViewMode) => void;
  t: (k: any) => string;
}) {
  return (
    <div
      role="tablist"
      aria-label={t('cal.view.label')}
      style={{
        display: 'inline-flex',
        background: theme.surface,
        border: `1px solid ${theme.border}`,
        borderRadius: 999,
        padding: 2,
      }}
    >
      {(['grid', 'agenda'] as const).map((mode) => {
        const active = view === mode;
        return (
          <button
            key={mode}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(mode)}
            style={{
              background: active ? theme.primary : 'transparent',
              color: active ? theme.onPrimary : theme.text,
              border: 0,
              borderRadius: 999,
              padding: '6px 14px',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            {mode === 'grid' ? t('cal.view.grid') : t('cal.view.agenda')}
          </button>
        );
      })}
    </div>
  );
}

function NavBtn({
  theme,
  onClick,
  children,
}: {
  theme: ReturnType<typeof useTheme>['theme'];
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        background: theme.surface,
        color: theme.text,
        border: `1px solid ${theme.border}`,
        borderRadius: 8,
        padding: '6px 10px',
        fontWeight: 700,
        fontSize: 12,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        cursor: 'pointer',
      }}
    >
      {children}
    </button>
  );
}
