import type { StartLocationStream } from '@minga/ui';

// Browser geolocation adapter for the shared useTracker hook.
export const startLocationStream: StartLocationStream = (onPoint, onError) => {
  if (!('geolocation' in navigator)) {
    onError?.(new Error('Geolocation unavailable in this browser'));
    return { stop: () => undefined };
  }
  const id = navigator.geolocation.watchPosition(
    (pos) =>
      onPoint({
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        altitude_m: pos.coords.altitude ?? null,
        speed_ms: pos.coords.speed ?? null,
        timestamp: pos.timestamp,
      }),
    (err) => onError?.(new Error(err.message)),
    { enableHighAccuracy: true, maximumAge: 1000, timeout: 10000 },
  );
  return {
    stop: () => navigator.geolocation.clearWatch(id),
  };
};
