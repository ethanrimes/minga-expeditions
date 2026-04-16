import React from 'react';
import { Badge } from './Badge';
import { tierColors } from '@minga/theme';
import type { TierLevel } from '@minga/types';

const LABELS: Record<TierLevel, string> = {
  bronze: 'BRONZE',
  silver: 'SILVER',
  gold: 'GOLD',
  diamond: 'DIAMOND',
};

export function TierBadge({ tier }: { tier: TierLevel }) {
  return <Badge label={LABELS[tier]} color={tierColors[tier]} textColor="#FFFFFF" />;
}
