import React from 'react';
import { Text, View } from 'react-native';
import { useTheme, spacing, fontSizes, fontWeights, radii, activityColors } from '@minga/theme';
import { formatDistanceKm, formatElevation, type ActivitySummary, type ActivityTotals } from '@minga/logic';
import { useT } from '@minga/i18n';
import { Icon } from '../primitives/Icon';

/**
 * Stacked metric cards — Todo (neutral) and Con Minga (featured: orange, medal
 * badge, share %) — so the Minga breakdown clearly dominates.
 */
export function MetricsBreakdown({ summary }: { summary: ActivitySummary }) {
  const { theme } = useTheme();
  const { t } = useT();
  const share = summary.all.count > 0 ? Math.round((summary.minga.count / summary.all.count) * 100) : 0;

  return (
    <View style={{ gap: spacing.sm }}>
      <Card theme={theme} t={t} label={t('profile.metricsAll')} accent={theme.primary} totals={summary.all} />
      <Card
        theme={theme}
        t={t}
        label={t('profile.metricsMinga')}
        accent={activityColors.minga}
        totals={summary.minga}
        featured
        share={share}
      />
    </View>
  );
}

function Card({
  theme,
  t,
  label,
  accent,
  totals,
  featured,
  share,
}: {
  theme: any;
  t: (k: any, vars?: any) => string;
  label: string;
  accent: string;
  totals: ActivityTotals;
  featured?: boolean;
  share?: number;
}) {
  const fg = featured ? '#fff' : theme.text;
  const muted = featured ? 'rgba(255,255,255,0.82)' : theme.textMuted;
  return (
    <View
      style={{
        backgroundColor: featured ? accent : theme.surface,
        borderColor: theme.border,
        borderWidth: featured ? 0 : 1,
        borderLeftWidth: featured ? 0 : 4,
        borderLeftColor: accent,
        borderRadius: radii.lg,
        padding: spacing.lg,
        gap: spacing.sm,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
        {featured ? (
          <Icon name="medal" size={16} color="#fff" strokeWidth={2.4} />
        ) : (
          <View style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: accent }} />
        )}
        <Text style={{ color: fg, fontWeight: fontWeights.bold, fontSize: fontSizes.sm }}>{label}</Text>
        {featured && typeof share === 'number' ? (
          <View
            style={{
              marginLeft: 'auto',
              backgroundColor: 'rgba(255,255,255,0.22)',
              borderRadius: radii.pill,
              paddingHorizontal: 10,
              paddingVertical: 2,
            }}
          >
            <Text style={{ color: '#fff', fontWeight: fontWeights.bold, fontSize: 12 }}>
              {t('profile.mingaShare', { pct: String(share) })}
            </Text>
          </View>
        ) : null}
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Metric fg={fg} muted={muted} value={String(totals.count)} label={t('stats.activities')} />
        <Metric fg={fg} muted={muted} value={formatDistanceKm(totals.distanceKm)} label={t('stats.totalKm')} />
        <Metric fg={fg} muted={muted} value={formatElevation(totals.elevationM)} label={t('stats.elevation')} />
      </View>
    </View>
  );
}

function Metric({ fg, muted, value, label }: { fg: string; muted: string; value: string; label: string }) {
  return (
    <View>
      <Text style={{ color: fg, fontSize: fontSizes.lg, fontWeight: fontWeights.heavy }}>{value}</Text>
      <Text style={{ color: muted, fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</Text>
    </View>
  );
}
