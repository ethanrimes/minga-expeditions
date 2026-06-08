import React, { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useTheme, spacing, fontSizes, fontWeights, radii, activityColors } from '@minga/theme';
import { useT } from '@minga/i18n';
import { buildMonthCalendar, earliestActivityMonth } from '@minga/logic';
import type { DbActivity } from '@minga/types';
import { Icon } from '../primitives/Icon';

type CalActivity = Pick<DbActivity, 'started_at' | 'expedition_id' | 'is_independent'>;

const monthIndex = (y: number, m: number) => y * 12 + m;

/**
 * Navigable month calendar (mirrors web). Days with activity are filled by their
 * dominant class — Minga days are solid, ringed and starred while independent
 * days get a lighter dashed-outline treatment so paid trips read first.
 */
export function ActivityCalendar({ activities }: { activities: CalActivity[] }) {
  const { theme } = useTheme();
  const { t, language } = useT();
  const locale = language === 'es' ? 'es-CO' : 'en-US';

  const now = new Date();
  const [view, setView] = useState({ year: now.getFullYear(), month: now.getMonth() });

  const cal = useMemo(
    () => buildMonthCalendar(activities, view.year, view.month, now),
    [activities, view.year, view.month],
  );

  const earliest = useMemo(() => earliestActivityMonth(activities), [activities]);
  const cur = monthIndex(view.year, view.month);
  const canPrev = earliest ? cur > monthIndex(earliest.year, earliest.month) : false;
  const canNext = cur < monthIndex(now.getFullYear(), now.getMonth());

  const step = (delta: number) => {
    const next = new Date(view.year, view.month + delta, 1);
    setView({ year: next.getFullYear(), month: next.getMonth() });
  };

  const monthLabel = new Date(view.year, view.month, 1).toLocaleDateString(locale, {
    month: 'long',
    year: 'numeric',
  });

  const weekdays = useMemo(() => {
    const base = new Date(2024, 0, 1); // a Monday
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      return d.toLocaleDateString(locale, { weekday: 'narrow' });
    });
  }, [locale]);

  return (
    <View
      style={{
        backgroundColor: theme.surface,
        borderColor: theme.border,
        borderWidth: 1,
        borderRadius: radii.lg,
        padding: spacing.lg,
        gap: spacing.md,
      }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ color: theme.text, fontWeight: fontWeights.bold, fontSize: fontSizes.md }}>
          {t('profile.calendarHeading')}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <NavButton theme={theme} disabled={!canPrev} onPress={() => step(-1)} label={t('profile.prevMonth')} icon="chevron-left" />
          <Text
            style={{
              color: theme.text,
              fontWeight: fontWeights.heavy,
              fontSize: fontSizes.sm,
              minWidth: 120,
              textAlign: 'center',
              textTransform: 'capitalize',
            }}
          >
            {monthLabel}
          </Text>
          <NavButton theme={theme} disabled={!canNext} onPress={() => step(1)} label={t('profile.nextMonth')} icon="chevron-right" />
        </View>
      </View>

      <View style={{ flexDirection: 'row' }}>
        {weekdays.map((w, i) => (
          <View key={i} style={{ flex: 1, alignItems: 'center' }}>
            <Text
              style={{
                color: theme.textMuted,
                fontSize: 10,
                fontWeight: fontWeights.bold,
                textTransform: 'uppercase',
              }}
            >
              {w}
            </Text>
          </View>
        ))}
      </View>

      <View style={{ gap: 6 }}>
        {cal.weeks.map((week, wi) => (
          <View key={wi} style={{ flexDirection: 'row', gap: 6 }}>
            {week.map((day, di) => {
              if (!day.inMonth) return <View key={`pad-${di}`} style={{ flex: 1, aspectRatio: 1 }} />;
              const minga = day.dominant === 'minga';
              const independent = day.dominant === 'independent';
              const accent = minga ? activityColors.minga : activityColors.independent;
              const active = day.count > 0;
              return (
                <View
                  key={day.date ?? `cell-${di}`}
                  style={{
                    flex: 1,
                    aspectRatio: 1,
                    borderRadius: radii.md,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: minga ? accent : independent ? `${accent}1f` : theme.surfaceAlt,
                    borderWidth: minga ? 2 : independent ? 1.5 : 1,
                    borderStyle: independent ? 'dashed' : 'solid',
                    borderColor: minga ? accent : independent ? accent : theme.border,
                  }}
                >
                  <Text
                    style={{
                      color: minga ? '#fff' : independent ? accent : theme.textMuted,
                      fontSize: 12,
                      fontWeight: active ? fontWeights.heavy : fontWeights.semibold,
                    }}
                  >
                    {day.day}
                  </Text>
                  {active ? (
                    <View style={{ flexDirection: 'row', gap: 2, marginTop: 2 }}>
                      {Array.from({ length: Math.min(day.count, 3) }).map((_, di2) => (
                        <View
                          key={ di2 }
                          style={{ width: 3, height: 3, borderRadius: 2, backgroundColor: minga ? '#fff' : accent }}
                        />
                      ))}
                    </View>
                  ) : null}
                </View>
              );
            })}
          </View>
        ))}
      </View>

      <View style={{ flexDirection: 'row', gap: spacing.lg, alignItems: 'center' }}>
        <LegendDot theme={theme} color={activityColors.minga} label={t('profile.legendMinga')} solid />
        <LegendDot theme={theme} color={activityColors.independent} label={t('profile.legendIndependent')} />
        <Text style={{ color: theme.textMuted, fontSize: fontSizes.sm, marginLeft: 'auto' }}>
          {t('profile.calendarActiveDays', { count: String(cal.totals.activeDays) })}
        </Text>
      </View>
    </View>
  );
}

function NavButton({
  theme,
  disabled,
  onPress,
  label,
  icon,
}: {
  theme: any;
  disabled?: boolean;
  onPress: () => void;
  label: string;
  icon: 'chevron-left' | 'chevron-right';
}) {
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      accessibilityLabel={label}
      hitSlop={6}
      style={{
        width: 32,
        height: 32,
        borderRadius: radii.pill,
        borderWidth: 1,
        borderColor: theme.border,
        backgroundColor: theme.surfaceAlt,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: disabled ? 0.4 : 1,
      }}
    >
      <Icon name={icon} size={18} color={disabled ? theme.textMuted : theme.text} strokeWidth={2.4} />
    </Pressable>
  );
}

function LegendDot({ theme, color, label, solid }: { theme: any; color: string; label: string; solid?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
      <View
        style={{
          width: 12,
          height: 12,
          borderRadius: 3,
          backgroundColor: solid ? color : `${color}1f`,
          borderWidth: solid ? 2 : 1.5,
          borderStyle: solid ? 'solid' : 'dashed',
          borderColor: color,
        }}
      />
      <Text style={{ color: theme.textMuted, fontSize: fontSizes.sm }}>{label}</Text>
    </View>
  );
}
