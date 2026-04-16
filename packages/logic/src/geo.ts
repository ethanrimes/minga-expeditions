import type { TrackPoint } from '@minga/types';

const EARTH_RADIUS_M = 6_371_000;

function toRad(deg: number) {
  return (deg * Math.PI) / 180;
}

export function haversineMeters(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h));
}

export interface TrackSummary {
  distanceKm: number;
  elevationGainM: number;
  durationSeconds: number;
  avgSpeedKmh: number;
}

// Walk a list of GPS points and fold them into a summary.
// Elevation gain only counts positive deltas above a small noise floor so we don't inflate numbers on flat ground.
export function summarizeTrack(points: TrackPoint[]): TrackSummary {
  if (points.length < 2) return { distanceKm: 0, elevationGainM: 0, durationSeconds: 0, avgSpeedKmh: 0 };
  let distanceM = 0;
  let elevGainM = 0;
  const ELEVATION_NOISE_FLOOR_M = 2;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const cur = points[i];
    distanceM += haversineMeters(prev, cur);
    const prevAlt = prev.altitude_m ?? null;
    const curAlt = cur.altitude_m ?? null;
    if (prevAlt !== null && curAlt !== null) {
      const dAlt = curAlt - prevAlt;
      if (dAlt > ELEVATION_NOISE_FLOOR_M) elevGainM += dAlt;
    }
  }
  const durationSec = Math.max(0, (points[points.length - 1].timestamp - points[0].timestamp) / 1000);
  const distanceKm = distanceM / 1000;
  const avgKmh = durationSec > 0 ? distanceKm / (durationSec / 3600) : 0;
  return {
    distanceKm,
    elevationGainM: elevGainM,
    durationSeconds: durationSec,
    avgSpeedKmh: avgKmh,
  };
}
