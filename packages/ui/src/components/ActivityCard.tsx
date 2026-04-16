import React from 'react';
import { Text, View } from 'react-native';
import { useTheme, radii, spacing, fontSizes, fontWeights } from '@minga/theme';
import { formatDistanceKm, formatDuration, formatElevation } from '@minga/logic';
import type { DbActivity } from '@minga/types';

const ACTIVITY_ICON: Record<DbActivity['activity_type'], string> = {
  hike: '🥾',
  ride: '🚴',
  run: '🏃',
  walk: '🚶',
};

export function ActivityCard({ activity }: { activity: DbActivity }) {
  const { theme } = useTheme();
  return (
    <View
      style={{
        backgroundColor: theme.surface,
        borderRadius: radii.md,
        borderWidth: 1,
        borderColor: theme.border,
        padding: spacing.lg,
        gap: spacing.sm,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
        <Text style={{ fontSize: fontSizes.xl }}>{ACTIVITY_ICON[activity.activity_type]}</Text>
        <Text style={{ color: theme.text, fontSize: fontSizes.md, fontWeight: fontWeights.semibold, flex: 1 }}>
          {activity.title}
        </Text>
        <Text style={{ color: theme.textMuted, fontSize: fontSizes.xs }}>
          {new Date(activity.started_at).toLocaleDateString()}
        </Text>
      </View>
      <View style={{ flexDirection: 'row', gap: spacing.xl }}>
        <Stat theme={theme} label="Distance" value={formatDistanceKm(activity.distance_km)} />
        <Stat theme={theme} label="Duration" value={formatDuration(activity.duration_seconds)} />
        <Stat theme={theme} label="Elevation" value={formatElevation(activity.elevation_gain_m)} />
      </View>
    </View>
  );
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
