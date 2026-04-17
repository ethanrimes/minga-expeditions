import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useTheme, radii, spacing, fontSizes, fontWeights } from '@minga/theme';
import { formatDistanceKm, formatDuration, formatElevation } from '@minga/logic';
import { useT } from '@minga/i18n';
import type { DbActivity } from '@minga/types';

const ACTIVITY_ICON: Record<DbActivity['activity_type'], string> = {
  hike: '🥾',
  ride: '🚴',
  run: '🏃',
  walk: '🚶',
};

export function ActivityCard({
  activity,
  onPress,
}: {
  activity: DbActivity;
  onPress?: () => void;
}) {
  const { theme } = useTheme();
  const { t, language } = useT();
  const locale = language === 'es' ? 'es-CO' : 'en-US';

  const body = (
    <>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
        <Text style={{ fontSize: fontSizes.xl }}>{ACTIVITY_ICON[activity.activity_type]}</Text>
        <Text style={{ color: theme.text, fontSize: fontSizes.md, fontWeight: fontWeights.semibold, flex: 1 }}>
          {activity.title}
        </Text>
        <Text style={{ color: theme.textMuted, fontSize: fontSizes.xs }}>
          {new Date(activity.started_at).toLocaleDateString(locale)}
        </Text>
      </View>
      <View style={{ flexDirection: 'row', gap: spacing.xl }}>
        <Stat theme={theme} label={t('stats.distance')} value={formatDistanceKm(activity.distance_km)} />
        <Stat theme={theme} label={t('stats.duration')} value={formatDuration(activity.duration_seconds)} />
        <Stat theme={theme} label={t('stats.elevation')} value={formatElevation(activity.elevation_gain_m)} />
      </View>
    </>
  );

  const style = {
    backgroundColor: theme.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: theme.border,
    padding: spacing.lg,
    gap: spacing.sm,
  };

  if (onPress) {
    return (
      <Pressable onPress={onPress} style={style}>
        {body}
      </Pressable>
    );
  }
  return <View style={style}>{body}</View>;
}

function Stat({ theme, label, value }: { theme: any; label: string; value: string }) {
  return (
    <View>
      <Text style={{ color: theme.text, fontSize: fontSizes.md, fontWeight: fontWeights.semibold }}>{value}</Text>
      <Text style={{ color: theme.textMuted, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 }}>
        {label}
      </Text>
    </View>
  );
}
