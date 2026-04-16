import type { TierLevel } from '@minga/types';

// Annual distance thresholds (km) — rough progression inspired by Giovanni's "10,000 km = Diamond" note,
// scaled to be hiking-realistic rather than cycling-realistic.
export const TIER_THRESHOLDS_KM: Record<TierLevel, number> = {
  bronze: 0,
  silver: 100,
  gold: 500,
  diamond: 2000,
};

export const TIER_ORDER: TierLevel[] = ['bronze', 'silver', 'gold', 'diamond'];

export function tierForDistance(km: number): TierLevel {
  let tier: TierLevel = 'bronze';
  for (const candidate of TIER_ORDER) {
    if (km >= TIER_THRESHOLDS_KM[candidate]) tier = candidate;
  }
  return tier;
}

export function nextTier(tier: TierLevel): TierLevel | null {
  const idx = TIER_ORDER.indexOf(tier);
  return idx >= 0 && idx < TIER_ORDER.length - 1 ? TIER_ORDER[idx + 1] : null;
}

export function progressToNextTier(km: number): { tier: TierLevel; next: TierLevel | null; pct: number; remainingKm: number } {
  const tier = tierForDistance(km);
  const next = nextTier(tier);
  if (!next) return { tier, next: null, pct: 1, remainingKm: 0 };
  const start = TIER_THRESHOLDS_KM[tier];
  const end = TIER_THRESHOLDS_KM[next];
  const pct = Math.min(1, Math.max(0, (km - start) / (end - start)));
  return { tier, next, pct, remainingKm: Math.max(0, end - km) };
}
