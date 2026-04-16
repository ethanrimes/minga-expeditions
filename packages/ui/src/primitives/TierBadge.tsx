import React from 'react';
import { Badge } from './Badge';
import { tierColors } from '@minga/theme';
import { useT } from '@minga/i18n';
import type { TierLevel } from '@minga/types';

const TIER_KEY: Record<TierLevel, any> = {
  bronze: 'tier.bronze',
  silver: 'tier.silver',
  gold: 'tier.gold',
  diamond: 'tier.diamond',
};

export function TierBadge({ tier }: { tier: TierLevel }) {
  const { t } = useT();
  return <Badge label={t(TIER_KEY[tier])} color={tierColors[tier]} textColor="#FFFFFF" />;
}
