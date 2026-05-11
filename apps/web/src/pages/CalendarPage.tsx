import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
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

type PriceBand = 'all' | 'free' | 'paid';

interface Filters {
  categoryId: string;
  region: string;
  difficulty: string;
  price: PriceBand;
}

const EMPTY: Filters = { categoryId: '', region: '', difficulty: '', price: 'all' };

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
  const [filters, setFilters] = useState<Filters>(EMPTY);
  const [cursor, setCursor] = useState<Date>(startOfMonth(new Date()));
  const [error, setError] = useState<string | null>(null);

  const dateLocale = language === 'es' ? 'es-CO' : 'en-US';

  useEffect(() => {
    let cancelled = false;
    const from = new Date();
    from.setMonth(from.getMonth() - 1, 1);
    const to = new Date();
    to.setMonth(to.getMonth() + 12, 0);
    const apiFilters: CalendarSalidaFilters = {
      category_id: filters.categoryId || null,
      region: filters.region || null,
      difficulty: filters.difficulty ? Number(filters.difficulty) : null,
      onlyFree: filters.price === 'free',
      onlyPaid: filters.price === 'paid',
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
  }, [filters]);

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

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px' }}>
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
      <p style={{ color: theme.textMuted, marginBottom: 24 }}>{t('cal.subtitle')}</p>

      {error ? <div style={{ color: theme.danger, marginBottom: 12 }}>{error}</div> : null}

      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 24 }}>
        <aside
          style={{
            background: theme.surface,
            border: `1px solid ${theme.border}`,
            borderRadius: 16,
            padding: 16,
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
            height: 'fit-content',
          }}
        >
          <FilterField label={t('cal.filters.category')} theme={theme}>
            <select
              data-testid="calendar-category"
              value={filters.categoryId}
              onChange={(e) => setFilters({ ...filters, categoryId: e.target.value })}
              style={inputStyle(theme)}
            >
              <option value="">{t('cal.filters.all')}</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {language === 'es' ? c.name_es : c.name_en}
                </option>
              ))}
            </select>
          </FilterField>

          <FilterField label={t('cal.filters.region')} theme={theme}>
            <select
              value={filters.region}
              onChange={(e) => setFilters({ ...filters, region: e.target.value })}
              style={inputStyle(theme)}
            >
              <option value="">{t('cal.filters.all')}</option>
              {regions.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </FilterField>

          <FilterField label={t('cal.filters.difficulty')} theme={theme}>
            <select
              value={filters.difficulty}
              onChange={(e) => setFilters({ ...filters, difficulty: e.target.value })}
              style={inputStyle(theme)}
            >
              <option value="">{t('cal.filters.all')}</option>
              {[1, 2, 3, 4, 5].map((d) => (
                <option key={d} value={d}>
                  {'●'.repeat(d)}
                  {'○'.repeat(5 - d)}
                </option>
              ))}
            </select>
          </FilterField>

          <FilterField label={t('cal.filters.price')} theme={theme}>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {(['all', 'free', 'paid'] as const).map((p) => {
                const active = filters.price === p;
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setFilters({ ...filters, price: p })}
                    style={{
                      background: active ? theme.primary : theme.surfaceAlt,
                      color: active ? theme.onPrimary : theme.text,
                      border: `1px solid ${active ? theme.primary : theme.border}`,
                      padding: '5px 12px',
                      borderRadius: 999,
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    {p === 'all'
                      ? t('cal.filters.all')
                      : p === 'free'
                        ? t('cal.filters.free')
                        : t('cal.filters.paid')}
                  </button>
                );
              })}
            </div>
          </FilterField>

          <button
            type="button"
            onClick={() => setFilters(EMPTY)}
            style={{
              background: 'transparent',
              border: 0,
              color: theme.primary,
              textAlign: 'left',
              fontWeight: 700,
              fontSize: 13,
              cursor: 'pointer',
              padding: 0,
            }}
          >
            {t('cal.filters.reset')}
          </button>
        </aside>

        <section
          style={{
            background: theme.surface,
            border: `1px solid ${theme.border}`,
            borderRadius: 16,
            padding: 16,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
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

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
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
                    background: inMonth ? theme.surface : theme.surfaceAlt,
                    border: `1px solid ${inMonth ? theme.border : 'transparent'}`,
                    borderRadius: 8,
                    padding: 6,
                    opacity: inMonth ? 1 : 0.5,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 4,
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

          <h3 style={{ color: theme.text, marginTop: 24 }}>{t('salida.upcomingHeading')}</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {salidas
              .filter((s) => new Date(s.starts_at).getTime() >= Date.now())
              .slice(0, 8)
              .map((s) => {
                const sold = isSoldOut(s);
                const { price_cents, currency } = priceCentsForSalida(s, s.expedition);
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
                        {sold ? t('salida.soldOut') : formatPriceCents(price_cents, { currency, freeLabel: t('common.free') })}
                      </div>
                    </div>
                  </Link>
                );
              })}
          </div>
        </section>
      </div>
    </div>
  );
}

function FilterField({
  label,
  theme,
  children,
}: {
  label: string;
  theme: ReturnType<typeof useTheme>['theme'];
  children: React.ReactNode;
}) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span
        style={{
          color: theme.text,
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: 0.3,
          textTransform: 'uppercase',
        }}
      >
        {label}
      </span>
      {children}
    </label>
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

function inputStyle(theme: ReturnType<typeof useTheme>['theme']): React.CSSProperties {
  return {
    background: theme.surface,
    color: theme.text,
    border: `1px solid ${theme.border}`,
    borderRadius: 8,
    padding: '8px 10px',
    fontSize: 13,
  };
}
