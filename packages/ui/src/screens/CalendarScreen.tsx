import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { useTheme, spacing, fontSizes, fontWeights, radii } from '@minga/theme';
import { useT } from '@minga/i18n';
import {
  fetchCategories,
  fetchSalidasInRange,
  getSupabase,
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
import { Screen } from '../primitives/Screen';
import { Icon } from '../primitives/Icon';
import { EmptyState } from '../components/EmptyState';
import {
  CalendarFilterModal,
  type CalendarFilterState,
  type CalendarViewMode,
  countActiveFilters,
  emptyCalendarFilter,
} from '../components/CalendarFilterModal';

interface Props {
  // Initial view mode. The user can toggle at runtime from inside the filter
  // modal — that toggle lives in this component's state.
  variant?: CalendarViewMode;
  onOpenExpedition?: (id: string) => void;
  monthsAhead?: number;
}

const PRICE_CEILING_FALLBACK = 2_000_000_00; // 2,000,000 COP

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
  const dayOfWeek = (first.getDay() + 6) % 7; // 0 = Monday
  const start = new Date(first);
  start.setDate(first.getDate() - dayOfWeek);
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}

export function CalendarScreen({ variant = 'grid', onOpenExpedition, monthsAhead = 12 }: Props) {
  const { theme } = useTheme();
  const { t, language } = useT();
  const [salidas, setSalidas] = useState<SalidaWithExpedition[]>([]);
  const [categories, setCategories] = useState<DbCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cursor, setCursor] = useState<Date>(startOfMonth(new Date()));
  const [view, setView] = useState<CalendarViewMode>(variant);
  const [filterOpen, setFilterOpen] = useState(false);
  // Price ceiling is recomputed from the data on each load. Held in state so
  // the modal slider knows where "+" begins. Falls back to a sensible default
  // before the first fetch resolves.
  const [priceCeiling, setPriceCeiling] = useState(PRICE_CEILING_FALLBACK);
  const [filters, setFilters] = useState<CalendarFilterState>(() =>
    emptyCalendarFilter(PRICE_CEILING_FALLBACK),
  );

  const dateLocale = language?.startsWith('es') ? 'es-CO' : 'en-US';

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    const from = new Date();
    from.setMonth(from.getMonth() - 1, 1);
    const to = new Date();
    to.setMonth(to.getMonth() + monthsAhead, 0);
    // Translate UI filter state into the query DSL. priceMin/Max ride the
    // raw min/max fields; "max == ceiling" means "no upper bound" so we drop
    // the constraint to avoid filtering out expeditions priced above ceiling.
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
      fetchSalidasInRange(getSupabase(), from.toISOString(), to.toISOString(), apiFilters),
      fetchCategories(getSupabase(), { activeOnly: true }),
    ])
      .then(([sals, cats]) => {
        if (cancelled) return;
        setSalidas(sals);
        setCategories(cats);
      })
      .catch((e) => !cancelled && setError(e?.message ?? 'Failed to load calendar'))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [filters, monthsAhead, priceCeiling]);

  // Bump the price ceiling once we see data — the slider snaps cleanly to a
  // power-of-two-ish number above the most expensive expedition.
  useEffect(() => {
    if (salidas.length === 0) return;
    const maxSeen = salidas.reduce((m, s) => {
      const p = s.price_cents ?? s.expedition.price_cents;
      return p > m ? p : m;
    }, 0);
    if (maxSeen <= 0) return;
    // Round up to nearest 100,000 COP.
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
      const key = dayKey(s.starts_at, s.timezone);
      const arr = map.get(key);
      if (arr) arr.push(s);
      else map.set(key, [s]);
    }
    return map;
  }, [salidas]);

  const activeCount = countActiveFilters(filters, priceCeiling);
  const currency = salidas[0]?.expedition.currency ?? salidas[0]?.currency ?? 'COP';

  return (
    <Screen>
      <View style={{ paddingTop: spacing.xl, gap: spacing.xs }}>
        <Text style={{ color: theme.textMuted, fontSize: fontSizes.sm, letterSpacing: 1 }}>
          MINGA EXPEDITIONS
        </Text>
        <Text style={{ color: theme.text, fontSize: fontSizes['2xl'], fontWeight: fontWeights.heavy }}>
          {t('cal.title')}
        </Text>
        <Text style={{ color: theme.textMuted, fontSize: fontSizes.sm }}>{t('cal.subtitle')}</Text>
      </View>

      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: spacing.sm,
        }}
      >
        <Pressable
          accessibilityLabel={t('cal.filters.open')}
          testID="calendar-filter-open"
          onPress={() => setFilterOpen(true)}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.xs,
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.sm,
            borderRadius: radii.pill,
            backgroundColor: theme.surface,
            borderWidth: 1,
            borderColor: activeCount > 0 ? theme.primary : theme.border,
          }}
        >
          <Icon name="sliders" size={16} color={activeCount > 0 ? theme.primary : theme.text} strokeWidth={2.2} />
          <Text
            style={{
              color: activeCount > 0 ? theme.primary : theme.text,
              fontWeight: fontWeights.bold,
              fontSize: fontSizes.sm,
            }}
          >
            {t('cal.filters.open')}
            {activeCount > 0 ? `  ·  ${t('cal.filters.activeCount').replace('{n}', String(activeCount))}` : ''}
          </Text>
        </Pressable>
        <ViewToggle view={view} onChange={setView} t={t} />
      </View>

      {loading ? (
        <ActivityIndicator />
      ) : error ? (
        <EmptyState iconName="flag" title={t('empty.couldNotLoad')} body={error} />
      ) : view === 'grid' ? (
        <GridView
          cursor={cursor}
          setCursor={setCursor}
          buckets={buckets}
          onOpenExpedition={onOpenExpedition}
          dateLocale={dateLocale}
          labels={{
            prev: t('cal.prev'),
            next: t('cal.next'),
            today: t('cal.today'),
            empty: t('cal.empty'),
            soldOut: t('salida.soldOut'),
          }}
        />
      ) : (
        <AgendaView
          salidas={salidas}
          onOpenExpedition={onOpenExpedition}
          dateLocale={dateLocale}
          freeLabel={t('common.free')}
          soldOutLabel={t('salida.soldOut')}
          emptyLabel={t('cal.empty')}
        />
      )}

      <CalendarFilterModal
        visible={filterOpen}
        onClose={() => setFilterOpen(false)}
        value={filters}
        onChange={setFilters}
        categories={categories}
        regions={regions}
        priceCeilingCents={priceCeiling}
        currency={currency}
      />
    </Screen>
  );
}

function ViewToggle({
  view,
  onChange,
  t,
}: {
  view: CalendarViewMode;
  onChange: (v: CalendarViewMode) => void;
  t: (k: any) => string;
}) {
  const { theme } = useTheme();
  return (
    <View
      accessibilityLabel={t('cal.view.label')}
      style={{
        flexDirection: 'row',
        backgroundColor: theme.surface,
        borderWidth: 1,
        borderColor: theme.border,
        borderRadius: radii.pill,
        padding: 2,
      }}
    >
      {(['grid', 'agenda'] as const).map((mode) => {
        const active = view === mode;
        return (
          <Pressable
            key={mode}
            onPress={() => onChange(mode)}
            accessibilityRole="button"
            style={{
              backgroundColor: active ? theme.primary : 'transparent',
              borderRadius: radii.pill,
              paddingVertical: 6,
              paddingHorizontal: spacing.sm,
            }}
          >
            <Text
              style={{
                color: active ? theme.onPrimary : theme.text,
                fontSize: fontSizes.xs,
                fontWeight: fontWeights.bold,
              }}
            >
              {mode === 'grid' ? t('cal.view.grid') : t('cal.view.agenda')}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function GridView({
  cursor,
  setCursor,
  buckets,
  onOpenExpedition,
  dateLocale,
  labels,
}: {
  cursor: Date;
  setCursor: (d: Date) => void;
  buckets: Map<string, SalidaWithExpedition[]>;
  onOpenExpedition?: (id: string) => void;
  dateLocale: string;
  labels: { prev: string; next: string; today: string; empty: string; soldOut: string };
}) {
  const { theme } = useTheme();
  const days = monthGrid(cursor);
  const monthLabel = cursor.toLocaleDateString(dateLocale, { month: 'long', year: 'numeric' });
  const monthStart = startOfMonth(cursor);
  const monthEnd = endOfMonth(cursor);
  const weekdays = dateLocale.startsWith('es')
    ? ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
    : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const anyInMonth = days.some(
    (d) => d >= monthStart && d <= monthEnd && (buckets.get(dayKey(d.toISOString())) ?? []).length > 0,
  );

  return (
    <View style={{ gap: spacing.sm }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text
          style={{
            color: theme.text,
            fontSize: fontSizes.lg,
            fontWeight: fontWeights.bold,
            textTransform: 'capitalize',
          }}
        >
          {monthLabel}
        </Text>
        <View style={{ flexDirection: 'row', gap: spacing.xs }}>
          <NavButton label={labels.prev} onPress={() => setCursor(addMonths(cursor, -1))} />
          <NavButton label={labels.today} onPress={() => setCursor(startOfMonth(new Date()))} />
          <NavButton label={labels.next} onPress={() => setCursor(addMonths(cursor, 1))} />
        </View>
      </View>

      <View style={{ flexDirection: 'row' }}>
        {weekdays.map((w) => (
          <View key={w} style={{ width: `${100 / 7}%`, paddingVertical: 4, paddingHorizontal: 2 }}>
            <Text style={{ color: theme.textMuted, fontSize: 10, fontWeight: fontWeights.bold }}>{w}</Text>
          </View>
        ))}
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {days.map((d, i) => {
          const inMonth = d >= monthStart && d <= monthEnd;
          const key = dayKey(d.toISOString());
          const items = buckets.get(key) ?? [];
          return (
            <View
              key={`${key}-${i}`}
              style={{
                width: `${100 / 7}%`,
                minHeight: 86,
                padding: 2,
              }}
            >
              <View
                style={{
                  flex: 1,
                  backgroundColor: inMonth ? theme.surface : 'transparent',
                  borderRadius: radii.sm,
                  borderWidth: 1,
                  borderColor: inMonth ? theme.border : 'transparent',
                  padding: 4,
                  opacity: inMonth ? 1 : 0.5,
                  gap: 2,
                  overflow: 'hidden',
                }}
              >
                <Text style={{ color: theme.textMuted, fontSize: 10 }}>{d.getDate()}</Text>
                {items.slice(0, 2).map((s) => {
                  const sold = isSoldOut(s);
                  return (
                    <Pressable
                      key={s.id}
                      testID={`cal-salida-${s.id}`}
                      onPress={() => onOpenExpedition?.(s.expedition.id)}
                      style={{
                        backgroundColor: sold ? theme.danger : theme.primary,
                        borderRadius: 4,
                        paddingVertical: 1,
                        paddingHorizontal: 4,
                      }}
                    >
                      <Text
                        numberOfLines={1}
                        style={{
                          color: theme.onPrimary,
                          fontSize: 9,
                          fontWeight: fontWeights.bold,
                        }}
                      >
                        {s.expedition.title}
                      </Text>
                    </Pressable>
                  );
                })}
                {items.length > 2 ? (
                  <Text style={{ color: theme.textMuted, fontSize: 9 }}>+{items.length - 2}</Text>
                ) : null}
              </View>
            </View>
          );
        })}
      </View>

      {!anyInMonth ? (
        <Text style={{ color: theme.textMuted, fontSize: fontSizes.sm, marginTop: spacing.sm }}>{labels.empty}</Text>
      ) : null}
    </View>
  );
}

function NavButton({ label, onPress }: { label: string; onPress: () => void }) {
  const { theme } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={{
        paddingHorizontal: spacing.sm,
        paddingVertical: 4,
        borderRadius: radii.sm,
        borderWidth: 1,
        borderColor: theme.border,
        backgroundColor: theme.surface,
      }}
    >
      <Text style={{ color: theme.text, fontSize: fontSizes.xs, fontWeight: fontWeights.semibold }}>{label}</Text>
    </Pressable>
  );
}

function AgendaView({
  salidas,
  onOpenExpedition,
  dateLocale,
  freeLabel,
  soldOutLabel,
  emptyLabel,
}: {
  salidas: SalidaWithExpedition[];
  onOpenExpedition?: (id: string) => void;
  dateLocale: string;
  freeLabel: string;
  soldOutLabel: string;
  emptyLabel: string;
}) {
  const { theme } = useTheme();
  if (salidas.length === 0) {
    return <Text style={{ color: theme.textMuted }}>{emptyLabel}</Text>;
  }
  const groups = new Map<string, SalidaWithExpedition[]>();
  for (const s of salidas) {
    const k = formatSalidaDate(s.starts_at, { locale: dateLocale, tz: s.timezone });
    const arr = groups.get(k);
    if (arr) arr.push(s);
    else groups.set(k, [s]);
  }
  return (
    <View style={{ gap: spacing.md }}>
      {Array.from(groups.entries()).map(([day, list]) => (
        <View key={day} style={{ gap: spacing.sm }}>
          <Text style={{ color: theme.text, fontWeight: fontWeights.bold }}>{day}</Text>
          {list.map((s) => {
            const sold = isSoldOut(s);
            const { price_cents, currency } = priceCentsForSalida(s, s.expedition);
            return (
              <Pressable
                key={s.id}
                onPress={() => onOpenExpedition?.(s.expedition.id)}
                style={{
                  backgroundColor: theme.surfaceAlt,
                  borderRadius: radii.lg,
                  padding: spacing.md,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: spacing.md,
                }}
              >
                <Icon name="calendar" size={18} color={theme.primary} strokeWidth={2.2} />
                <View style={{ flex: 1 }}>
                  <Text style={{ color: theme.text, fontWeight: fontWeights.semibold }}>{s.expedition.title}</Text>
                  <Text style={{ color: theme.textMuted, fontSize: fontSizes.xs, marginTop: 2 }}>
                    {formatSalidaRange(s.starts_at, s.ends_at, { locale: dateLocale, tz: s.timezone })}
                    {' · '}
                    {sold ? soldOutLabel : formatPriceCents(price_cents, { currency, freeLabel })}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}
