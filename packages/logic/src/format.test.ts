import { describe, it, expect } from 'vitest';
import {
  formatDistanceKm,
  formatDuration,
  formatElevation,
  formatPace,
  formatPriceCents,
  formatSpeedKmh,
  relativeTime,
} from './format';

describe('formatDistanceKm', () => {
  it('shows metres under 1 km', () => {
    expect(formatDistanceKm(0)).toBe('0 m');
    expect(formatDistanceKm(0.45)).toBe('450 m');
    expect(formatDistanceKm(0.999)).toBe('999 m');
  });

  it('shows km with one decimal at 1 km and above', () => {
    expect(formatDistanceKm(1)).toBe('1.0 km');
    expect(formatDistanceKm(12.34)).toBe('12.3 km');
  });

  it('respects locale grouping', () => {
    // 1234.5 in en-US uses a thousands separator
    const out = formatDistanceKm(1234.5, 'en-US');
    expect(out).toMatch(/^1,234\.5 km$/);
  });
});

describe('formatElevation', () => {
  it('rounds to whole metres', () => {
    expect(formatElevation(0)).toBe('0 m');
    // 1234.7 rounds up to 1235; locale grouping is optional.
    expect(formatElevation(1234.7)).toMatch(/^1[,.]?235 m$/);
    expect(formatElevation(99.4)).toBe('99 m');
  });
});

describe('formatDuration', () => {
  it('shows seconds when under a minute', () => {
    expect(formatDuration(0)).toBe('0s');
    expect(formatDuration(45)).toBe('45s');
  });

  it('shows minutes and seconds under an hour', () => {
    expect(formatDuration(75)).toBe('1m 15s');
    expect(formatDuration(3599)).toBe('59m 59s');
  });

  it('shows hours and zero-padded minutes from an hour', () => {
    expect(formatDuration(3600)).toBe('1h 00m');
    expect(formatDuration(3660)).toBe('1h 01m');
    expect(formatDuration(7325)).toBe('2h 02m');
  });
});

describe('formatPace', () => {
  it('returns em-dash for non-positive distance', () => {
    expect(formatPace(0, 600)).toBe('—');
    expect(formatPace(-1, 600)).toBe('—');
  });

  it('formats as min:ss /km', () => {
    // 5 km in 25 minutes = 5:00 /km
    expect(formatPace(5, 25 * 60)).toBe('5:00 /km');
    // 10 km in 51:30 → 5:09 /km (roughly)
    expect(formatPace(10, 51 * 60 + 30)).toBe('5:09 /km');
  });
});

describe('formatSpeedKmh', () => {
  it('returns em-dash for zero duration', () => {
    expect(formatSpeedKmh(5, 0)).toBe('—');
  });

  it('computes km/h with one decimal', () => {
    // 10 km in an hour
    expect(formatSpeedKmh(10, 3600)).toBe('10.0 km/h');
    // 5 km in 30 min = 10 km/h
    expect(formatSpeedKmh(5, 1800)).toBe('10.0 km/h');
  });
});

describe('formatPriceCents', () => {
  it('returns the free label when price is zero', () => {
    expect(formatPriceCents(0)).toBe('Free');
    expect(formatPriceCents(0, { freeLabel: 'Gratis' })).toBe('Gratis');
  });

  it('formats COP without decimals by default', () => {
    const out = formatPriceCents(50_000_00); // 50,000.00 → 5_000_000 cents → 50,000 COP
    // Locale-dependent grouping; check the digits and currency code/sign
    expect(out).toMatch(/50.000/);
  });

  it('falls back gracefully on unsupported currency', () => {
    const out = formatPriceCents(100, { currency: 'ZZZ' });
    expect(out).toMatch(/1/);
  });

  it('accepts the legacy positional currency arg', () => {
    const out = formatPriceCents(100_00, 'USD');
    expect(out).toMatch(/100/);
  });
});

describe('relativeTime', () => {
  const now = new Date('2026-05-08T12:00:00Z');

  it('reports just-now for very recent timestamps', () => {
    const past = new Date(now.getTime() - 5_000); // 5 seconds ago
    expect(relativeTime(past, 'en', now)).toMatch(/now|second/i);
  });

  it('reports days ago across day boundary', () => {
    const past = new Date(now.getTime() - 3 * 86_400_000);
    expect(relativeTime(past, 'en', now)).toMatch(/3 days ago/i);
  });

  it('reports months ago for multi-month gaps', () => {
    const past = new Date(now.getTime() - 90 * 86_400_000);
    expect(relativeTime(past, 'en', now)).toMatch(/months? ago/i);
  });

  it('handles string ISO inputs', () => {
    const past = new Date(now.getTime() - 60_000).toISOString();
    expect(relativeTime(past, 'en', now)).toMatch(/minute|now/i);
  });
});
