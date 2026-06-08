import React from 'react';
import { Text, View } from 'react-native';
import { useTheme, spacing, fontSizes, fontWeights, radii, activityColors } from '@minga/theme';
import { formatDistanceKm, formatElevation, type ActivitySummary, type ActivityTotals } from '@minga/logic';
import { useT } from '@minga/i18n';

/**
 * Three side-by-side metric cards — everything / with Minga / on your own —
 * each topped with its activity-class accent so the breakdown reads at a glance.
 */
export function MetricsBreakdown({ summary }: { summary: ActivitySummary }) {
  const { theme } = useTheme();
  const { t } = useT();

  return (
    <View style={{ gap: spacing.sm }}>
      <Card theme={theme} t={t} label={t('profile.metricsAll')} accent={theme.primary} totals={summary.all} />
      <Card theme={theme} t={t} label={t('profile.metricsMinga')} accent={activityColors.minga} totals={summary.minga} />
    </View>
  );
}

function Card({
  theme,
  t,
  label,
  accent,
  totals,
}: {
  theme: any;
  t: (k: any) => string;
  label: string;
  accent: string;
  totals: ActivityTotals;
}) {
  return (
    <View
      style={{
        backgroundColor: theme.surface,
        borderColor: theme.border,
        borderWidth: 1,
        borderLeftWidth: 4,
        borderLeftColor: accent,
        borderRadius: radii.lg,
        padding: spacing.lg,
        gap: spacing.sm,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
        <View style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: accent }} />
        <Text style={{ color: theme.text, fontWeight: fontWeights.bold, fontSize: fontSizes.sm }}>{label}</Text>
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Metric theme={theme} value={String(totals.count)} label={t('stats.activities')} />
        <Metric theme={theme} value={formatDistanceKm(totals.distanceKm)} label={t('stats.totalKm')} />
        <Metric theme={theme} value={formatElevation(totals.elevationM)} label={t('stats.elevation')} />
      </View>
    </View>
  );
}

function Metric({ theme, value, label }: { theme: any; value: string; label: string }) {
  return (
    <View>
      <Text style={{ color: theme.text, fontSize: fontSizes.lg, fontWeight: fontWeights.heavy }}>{value}</Text>
      <Text style={{ color: theme.textMuted, fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>
        {label}
      </Text>
    </View>
  );
}
