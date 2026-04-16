import * as Location from 'expo-location';
import type { StartLocationStream } from '@minga/ui';

// Native adapter for the shared useTracker hook.
// Requests foreground permission then streams positions via expo-location's watchPositionAsync.
export const startLocationStream: StartLocationStream = async (onPoint, onError) => {
  const perm = await Location.requestForegroundPermissionsAsync();
  if (perm.status !== 'granted') {
    onError?.(new Error('Location permission denied'));
    return { stop: () => undefined };
  }

  const sub = await Location.watchPositionAsync(
    {
      accuracy: Location.Accuracy.BestForNavigation,
      timeInterval: 1500,
      distanceInterval: 3,
    },
    (loc) =>
      onPoint({
        lat: loc.coords.latitude,
        lng: loc.coords.longitude,
        altitude_m: loc.coords.altitude ?? null,
        speed_ms: loc.coords.speed ?? null,
        timestamp: loc.timestamp,
      }),
  );

  return {
    stop: () => sub.remove(),
  };
};
