import * as Location from 'expo-location';
import type { LocationAdapter, LocationPermissionStatus } from '@minga/ui';

// expo-location's PermissionStatus has a `canAskAgain` flag; we treat
// "denied + can ask again" as `undetermined` so the gate keeps showing the
// initial Allow CTA, and "denied + can't ask again" as a true `denied` state
// (user must open OS settings).
function toStatus(perm: Location.LocationPermissionResponse): LocationPermissionStatus {
  if (perm.status === Location.PermissionStatus.GRANTED) return 'granted';
  if (perm.status === Location.PermissionStatus.UNDETERMINED) return 'undetermined';
  return perm.canAskAgain ? 'undetermined' : 'denied';
}

export const locationAdapter: LocationAdapter = {
  async getPermissionStatus() {
    try {
      const perm = await Location.getForegroundPermissionsAsync();
      return toStatus(perm);
    } catch {
      return 'unsupported';
    }
  },
  async requestPermission() {
    try {
      const perm = await Location.requestForegroundPermissionsAsync();
      return toStatus(perm);
    } catch {
      return 'unsupported';
    }
  },
  // Native adapter for the shared useTracker hook. Permission is guaranteed
  // granted before this is called (TrackScreen gates Start on permission), so
  // we go straight to watchPositionAsync.
  startLocationStream: async (onPoint, onError) => {
    const perm = await Location.getForegroundPermissionsAsync();
    if (perm.status !== Location.PermissionStatus.GRANTED) {
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

    return { stop: () => sub.remove() };
  },
};
