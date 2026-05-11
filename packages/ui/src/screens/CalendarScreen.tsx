import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
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

interface Props {
  // Variant decides whether to render a month grid (web/mobile-web) or a
  // chronological agenda list (native mobile, where a 7-column grid is too
  // cramped). Both consume the same data and filters.
  variant?: 'grid' | 'agenda';
  onOpenExpedition?: (id: string) => void;
  monthsAhead?: number;
}

type PriceBand = 'all' | 'free' | 'paid';

interface UiFilters {
  categoryId: string;
  region: string;
  difficulty: string;
  price: PriceBand;
}

const EMPTY: UiFilters = { categoryId: '', region: '', difficulty: '', price: 'all' };

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
  const [ui, setUi] = useState<UiFilters>(EMPTY);

  const dateLocale = language?.startsWith('es') ? 'es-CO' : 'en-US';

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    const from = new Date();
    from.setMonth(from.getMonth() - 1, 1);
    const to = new Date();
    to.setMonth(to.getMonth() + monthsAhead, 0);
    const filters: CalendarSalidaFilters = {
      category_id: ui.categoryId || null,
      region: ui.region || null,
      difficulty: ui.difficulty ? Number(ui.difficulty) : null,
      onlyFree: ui.price === 'free',
      onlyPaid: ui.price === 'paid',
    };
    Promise.all([
      fetchSalidasInRange(getSupabase(), from.toISOString(), to.toISOString(), filters),
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
  }, [ui, monthsAhead]);

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

      <FiltersBar
        ui={ui}
        setUi={setUi}
        categories={categories}
        regions={regions}
        labels={{
          all: t('cal.filters.all'),
          free: t('cal.filters.free'),
          paid: t('cal.filters.paid'),
          reset: t('cal.filters.reset'),
          category: t('cal.filters.category'),
          region: t('cal.filters.region'),
          difficulty: t('cal.filters.difficulty'),
          price: t('cal.filters.price'),
        }}
        language={language}
      />

      {loading ? (
        <ActivityIndicator />
      ) : error ? (
        <EmptyState iconName="flag" title={t('empty.couldNotLoad')} body={error} />
      ) : variant === 'grid' ? (
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
    </Screen>
  );
}

function FiltersBar({
  ui,
  setUi,
  categories,
  regions,
  labels,
  language,
}: {
  ui: UiFilters;
  setUi: (next: UiFilters) => void;
  categories: DbCategory[];
  regions: string[];
  labels: {
    all: string;
    free: string;
    paid: string;
    reset: string;
    category: string;
    region: string;
    difficulty: string;
    price: string;
  };
  language: string;
}) {
  const { theme } = useTheme();
  return (
    <View style={{ gap: spacing.sm }}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={{ flexDirection: 'row', gap: spacing.xs, paddingVertical: spacing.xs }}>
          <Pill
            label={labels.all}
            active={ui.categoryId === '' && ui.region === '' && ui.difficulty === '' && ui.price === 'all'}
            onPress={() => setUi(EMPTY)}
          />
          {categories.map((c) => (
            <Pill
              key={c.id}
              label={language?.startsWith('es') ? c.name_es : c.name_en}
              active={ui.categoryId === c.id}
              onPress={() => setUi({ ...ui, categoryId: ui.categoryId === c.id ? '' : c.id })}
            />
          ))}
        </View>
      </ScrollView>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={{ flexDirection: 'row', gap: spacing.xs, paddingVertical: spacing.xs }}>
          {(['all', 'free', 'paid'] as const).map((p) => (
            <Pill
              key={p}
              label={p === 'all' ? labels.price : p === 'free' ? labels.free : labels.paid}
              active={ui.price === p}
              onPress={() => setUi({ ...ui, price: p })}
            />
          ))}
          {[1, 2, 3, 4, 5].map((d) => (
            <Pill
              key={`diff-${d}`}
              label={`${labels.difficulty} ${d}`}
              active={ui.difficulty === String(d)}
              onPress={() => setUi({ ...ui, difficulty: ui.difficulty === String(d) ? '' : String(d) })}
            />
          ))}
        </View>
      </ScrollView>

      {regions.length > 0 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ flexDirection: 'row', gap: spacing.xs, paddingVertical: spacing.xs }}>
            {regions.map((r) => (
              <Pill
                key={r}
                label={r}
                active={ui.region === r}
                onPress={() => setUi({ ...ui, region: ui.region === r ? '' : r })}
              />
            ))}
          </View>
        </ScrollView>
      ) : null}

      {(ui.categoryId || ui.region || ui.difficulty || ui.price !== 'all') ? (
        <Pressable onPress={() => setUi(EMPTY)}>
          <Text style={{ color: theme.primary, fontWeight: fontWeights.semibold, fontSize: fontSizes.xs }}>
            {labels.reset}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function Pill({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  const { theme } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={{
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
        backgroundColor: active ? theme.primary : theme.surfaceAlt,
        borderRadius: radii.pill,
        borderWidth: 1,
        borderColor: active ? theme.primary : theme.border,
      }}
    >
      <Text
        style={{
          color: active ? theme.onPrimary : theme.text,
          fontSize: fontSizes.xs,
          fontWeight: fontWeights.semibold,
        }}
      >
        {label}
      </Text>
    </Pressable>
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
          <View key={w} style={{ flex: 1, paddingVertical: 4 }}>
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
                width: '14.285%',
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
