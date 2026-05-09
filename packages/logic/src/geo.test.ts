import { describe, it, expect } from 'vitest';
import { haversineMeters, summarizeTrack } from './geo';

describe('haversineMeters', () => {
  it('is zero for identical points', () => {
    expect(haversineMeters({ lat: 4.6, lng: -74.08 }, { lat: 4.6, lng: -74.08 })).toBe(0);
  });

  it('matches a known reference distance', () => {
    // Bogotá → Medellín: ~ 240 km in a straight line.
    const bog = { lat: 4.711, lng: -74.0721 };
    const med = { lat: 6.2442, lng: -75.5812 };
    const m = haversineMeters(bog, med);
    expect(m / 1000).toBeGreaterThan(230);
    expect(m / 1000).toBeLessThan(260);
  });

  it('is symmetric', () => {
    const a = { lat: 4.6, lng: -74.08 };
    const b = { lat: 5.0, lng: -75.0 };
    expect(haversineMeters(a, b)).toBeCloseTo(haversineMeters(b, a), 6);
  });
});

describe('summarizeTrack', () => {
  it('returns zeros for empty or single-point tracks', () => {
    expect(summarizeTrack([])).toEqual({
      distanceKm: 0,
      elevationGainM: 0,
      durationSeconds: 0,
      avgSpeedKmh: 0,
    });
    expect(
      summarizeTrack([{ lat: 4.6, lng: -74.08, altitude_m: 2600, speed_ms: 0, timestamp: 0 }]),
    ).toEqual({ distanceKm: 0, elevationGainM: 0, durationSeconds: 0, avgSpeedKmh: 0 });
  });

  it('sums distance + duration + avg speed across points', () => {
    const start = 1_000_000;
    const points = [
      { lat: 4.6, lng: -74.08, altitude_m: 2600, speed_ms: 0, timestamp: start },
      // ~111 m east per 0.001° lng at equator-ish latitudes
      { lat: 4.6, lng: -74.079, altitude_m: 2600, speed_ms: 0, timestamp: start + 60_000 },
      { lat: 4.6, lng: -74.078, altitude_m: 2600, speed_ms: 0, timestamp: start + 120_000 },
    ];
    const s = summarizeTrack(points);
    expect(s.durationSeconds).toBeCloseTo(120, 0);
    expect(s.distanceKm).toBeGreaterThan(0.1);
    expect(s.distanceKm).toBeLessThan(0.5);
    expect(s.avgSpeedKmh).toBeGreaterThan(0);
  });

  it('only counts elevation gain above the noise floor', () => {
    const start = 1_000_000;
    const flat = (alt: number, t: number) => ({ lat: 4.6, lng: -74.08, altitude_m: alt, speed_ms: 0, timestamp: t });
    // Three +1m bumps would add 3m gain naively but the filter drops them.
    const points = [flat(2600, start), flat(2601, start + 1000), flat(2602, start + 2000), flat(2603, start + 3000)];
    expect(summarizeTrack(points).elevationGainM).toBe(0);
  });

  it('does count climbs above the noise floor', () => {
    const start = 1_000_000;
    const flat = (alt: number, t: number) => ({ lat: 4.6, lng: -74.08, altitude_m: alt, speed_ms: 0, timestamp: t });
    const points = [flat(2600, start), flat(2625, start + 1000), flat(2650, start + 2000)];
    expect(summarizeTrack(points).elevationGainM).toBe(50);
  });

  it('ignores elevation when altitudes are missing', () => {
    const start = 1_000_000;
    const points = [
      { lat: 4.6, lng: -74.08, altitude_m: null, speed_ms: 0, timestamp: start },
      { lat: 4.6, lng: -74.078, altitude_m: null, speed_ms: 0, timestamp: start + 60_000 },
    ];
    expect(summarizeTrack(points).elevationGainM).toBe(0);
  });
});
