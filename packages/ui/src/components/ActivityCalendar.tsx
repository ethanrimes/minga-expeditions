import React from 'react';
import { Text, View } from 'react-native';
import { useTheme, spacing, fontSizes, fontWeights, radii, activityColors } from '@minga/theme';
import { useT } from '@minga/i18n';
import type { ActivityCalendar as ActivityCalendarData } from '@minga/logic';

/**
 * Contribution-style grid: each column is a week of 7 day-cells, colored by the
 * day's dominant class — Minga orange vs. independent blue. Empty days fade to a
 * muted surface so streaks of activity stand out.
 */
export function ActivityCalendar({ data }: { data: ActivityCalendarData }) {
  const { theme } = useTheme();
  const { t } = useT();

  const weeks: typeof data.days[] = [];
  for (let i = 0; i < data.days.length; i += 7) {
    weeks.push(data.days.slice(i, i + 7));
  }

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
        <Text style={{ color: theme.textMuted, fontSize: fontSizes.sm }}>
          {t('profile.calendarActiveDays', { count: String(data.activeDays) })}
        </Text>
      </View>
      <View style={{ flexDirection: 'row', gap: 3, flexWrap: 'wrap' }}>
        {weeks.map((week, wi) => (
          <View key={wi} style={{ gap: 3 }}>
            {week.map((day) => {
              const active = day.count > 0 && day.dominant;
              return (
                <View
                  key={day.date}
                  style={{
                    width: 11,
                    height: 11,
                    borderRadius: 2,
                    backgroundColor: active ? activityColors[day.dominant as 'minga' | 'independent'] : theme.surfaceAlt,
                    opacity: day.count === 0 ? 1 : Math.min(1, 0.55 + day.count * 0.2),
                    borderWidth: 1,
                    borderColor: theme.border,
                  }}
                />
              );
            })}
          </View>
        ))}
      </View>
      <View style={{ flexDirection: 'row', gap: spacing.lg }}>
        <LegendDot theme={theme} color={activityColors.minga} label={t('profile.legendMinga')} />
        <LegendDot theme={theme} color={activityColors.independent} label={t('profile.legendIndependent')} />
      </View>
    </View>
  );
}

function LegendDot({ theme, color, label }: { theme: any; color: string; label: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
      <View style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: color }} />
      <Text style={{ color: theme.textMuted, fontSize: fontSizes.sm }}>{label}</Text>
    </View>
  );
}
