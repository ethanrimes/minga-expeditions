import { describe, it, expect } from 'vitest';
import { TIER_THRESHOLDS_KM, nextTier, progressToNextTier, tierForDistance } from './tier';

describe('tierForDistance', () => {
  it('starts every traveler at bronze', () => {
    expect(tierForDistance(0)).toBe('bronze');
    expect(tierForDistance(99)).toBe('bronze');
  });

  it('promotes at the threshold boundaries', () => {
    expect(tierForDistance(TIER_THRESHOLDS_KM.silver)).toBe('silver');
    expect(tierForDistance(TIER_THRESHOLDS_KM.gold)).toBe('gold');
    expect(tierForDistance(TIER_THRESHOLDS_KM.diamond)).toBe('diamond');
  });

  it('caps at diamond', () => {
    expect(tierForDistance(10_000)).toBe('diamond');
  });

  it('rejects negatives gracefully (treats as bronze)', () => {
    expect(tierForDistance(-50)).toBe('bronze');
  });
});

describe('nextTier', () => {
  it('walks up the chain', () => {
    expect(nextTier('bronze')).toBe('silver');
    expect(nextTier('silver')).toBe('gold');
    expect(nextTier('gold')).toBe('diamond');
  });

  it('returns null at the top', () => {
    expect(nextTier('diamond')).toBeNull();
  });
});

describe('progressToNextTier', () => {
  it('returns 0% at the start of a tier', () => {
    const p = progressToNextTier(0);
    expect(p.tier).toBe('bronze');
    expect(p.next).toBe('silver');
    expect(p.pct).toBe(0);
    expect(p.remainingKm).toBe(TIER_THRESHOLDS_KM.silver);
  });

  it('returns 50% at the midpoint of a tier', () => {
    const half = (TIER_THRESHOLDS_KM.silver + TIER_THRESHOLDS_KM.gold) / 2;
    const p = progressToNextTier(half);
    expect(p.tier).toBe('silver');
    expect(p.next).toBe('gold');
    expect(p.pct).toBeCloseTo(0.5, 5);
  });

  it('saturates at 100% once you hit the top', () => {
    const p = progressToNextTier(99_999);
    expect(p.tier).toBe('diamond');
    expect(p.next).toBeNull();
    expect(p.pct).toBe(1);
    expect(p.remainingKm).toBe(0);
  });
});
