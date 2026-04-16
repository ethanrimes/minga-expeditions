import React from 'react';
import { Text, View } from 'react-native';
import { useTheme, spacing, fontSizes, fontWeights, radii, tierColors } from '@minga/theme';
import { progressToNextTier, formatDistanceKm, TIER_THRESHOLDS_KM } from '@minga/logic';
import { useT } from '@minga/i18n';
import type { TierLevel } from '@minga/types';

const TIER_KEY: Record<TierLevel, any> = {
  bronze: 'tier.bronze',
  silver: 'tier.silver',
  gold: 'tier.gold',
  diamond: 'tier.diamond',
};

export function TierProgress({ distanceKm }: { distanceKm: number }) {
  const { theme } = useTheme();
  const { t } = useT();
  const { tier, next, pct, remainingKm } = progressToNextTier(distanceKm);
  return (
    <View style={{ gap: spacing.xs }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text style={{ color: theme.text, fontWeight: fontWeights.bold }}>
          {t(TIER_KEY[tier])}
          {next ? ` → ${t(TIER_KEY[next])}` : ` · ${t('tier.maxTier')}`}
        </Text>
        <Text style={{ color: theme.textMuted, fontSize: fontSizes.sm }}>
          {formatDistanceKm(distanceKm)}
        </Text>
      </View>
      <View
        style={{
          height: 10,
          backgroundColor: theme.surfaceAlt,
          borderRadius: radii.pill,
          overflow: 'hidden',
        }}
      >
        <View
          style={{
            width: `${Math.round(pct * 100)}%`,
            backgroundColor: tierColors[next ?? tier],
            height: '100%',
          }}
        />
      </View>
      {next ? (
        <Text style={{ color: theme.textMuted, fontSize: fontSizes.xs }}>
          {formatDistanceKm(remainingKm)} {t('profile.tierToGo')} {t(TIER_KEY[next])}
          {' '}({t('tier.thresholdSuffix')} {formatDistanceKm(TIER_THRESHOLDS_KM[next])})
        </Text>
      ) : null}
    </View>
  );
}
