import type { LocationAdapter, LocationPermissionStatus } from '@minga/ui';

// Browser geolocation adapter for the shared useTracker hook.
//
// Permission model on the web:
//   - `navigator.permissions.query({name: 'geolocation'})` returns
//     'granted' | 'denied' | 'prompt' — but isn't supported in every
//     runtime (older Safari iOS, in-app WebViews). When the API is missing
//     we return `undetermined`, so the user sees the Allow CTA and the
//     prompt fires when they tap it via getCurrentPosition.
//   - There's no separate "request permission" call in the geolocation API;
//     the prompt is shown the first time you call getCurrentPosition or
//     watchPosition. We use a one-shot getCurrentPosition to elicit it.

function permissionStateToStatus(state: PermissionState): LocationPermissionStatus {
  if (state === 'granted') return 'granted';
  if (state === 'denied') return 'denied';
  return 'undetermined'; // 'prompt'
}

async function queryPermissionStatus(): Promise<LocationPermissionStatus | null> {
  const perms = (navigator as Navigator & { permissions?: Permissions }).permissions;
  if (!perms?.query) return null;
  try {
    const result = await perms.query({ name: 'geolocation' as PermissionName });
    return permissionStateToStatus(result.state);
  } catch {
    return null;
  }
}

function probePermissionStatus(): Promise<LocationPermissionStatus> {
  // Fallback for browsers without the Permissions API: a one-shot read shows
  // the system prompt and resolves with the resulting state. We only call
  // this from `requestPermission()` — never from `getPermissionStatus()` —
  // so we don't surprise the user with a prompt on screen mount.
  return new Promise((resolve) => {
    if (!('geolocation' in navigator)) {
      resolve('unsupported');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      () => resolve('granted'),
      (err) => {
        // 1 = PERMISSION_DENIED, 2 = POSITION_UNAVAILABLE, 3 = TIMEOUT.
        // We treat denied as denied; the other two leave the state
        // ambiguous (often hardware-related), so we report `denied` to be
        // safe — the user can retry from the gate panel.
        if (err.code === 1) resolve('denied');
        else resolve('denied');
      },
      { enableHighAccuracy: false, maximumAge: 60000, timeout: 10000 },
    );
  });
}

export const locationAdapter: LocationAdapter = {
  async getPermissionStatus() {
    if (!('geolocation' in navigator)) return 'unsupported';
    const queried = await queryPermissionStatus();
    if (queried) return queried;
    // Permissions API unavailable — don't probe (would prompt the user).
    // Surface as `undetermined` so the Allow CTA is shown; tapping it will
    // probe via `requestPermission` and trigger the system prompt.
    return 'undetermined';
  },
  async requestPermission() {
    if (!('geolocation' in navigator)) return 'unsupported';
    const queried = await queryPermissionStatus();
    if (queried === 'granted' || queried === 'denied') return queried;
    return probePermissionStatus();
  },
  startLocationStream: (onPoint, onError) => {
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
  },
};
