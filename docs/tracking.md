# Strava-style tracking

The tracker engine lives in `packages/ui/src/hooks/useTracker.ts` and is **platform-agnostic**. Each app injects an adapter that knows how to stream GPS points on its platform.

## The hook

```ts
const { status, summary, elapsed, points, start, pause, resume, stop, reset }
  = useTracker(startLocationStream);
```

- `status`: `'idle' | 'recording' | 'paused' | 'ended'`
- `summary`: live { distanceKm, elevationGainM, durationSeconds, avgSpeedKmh }
- `elapsed`: seconds, respects pauses (source of truth for duration)
- `points`: array of `TrackPoint { lat, lng, altitude_m, speed_ms, timestamp }`

## Adapters

Each app wires platform location into the hook's `StartLocationStream` shape:

```ts
type StartLocationStream = (
  onPoint: (p: TrackPoint) => void,
  onError?: (err: Error) => void,
) => Promise<LocationStreamHandle> | LocationStreamHandle;
```

### Web — `apps/mobile-web/src/locationAdapter.ts`

Uses `navigator.geolocation.watchPosition` with `enableHighAccuracy: true`. Works in any browser over HTTPS (and localhost).

### Native — `apps/mobile/src/locationAdapter.ts`

Uses `Location.watchPositionAsync` from `expo-location`. Requests foreground permission first; streams positions at 1.5s / 3m thresholds with `Accuracy.BestForNavigation`.

### Desktop web (`apps/web/src/pages/TrackPage.tsx`)

Inlines the same browser geolocation logic directly — no adapter, because this page doesn't depend on `@minga/ui`.

## Distance & elevation math

`packages/logic/src/geo.ts` has `haversineMeters` and `summarizeTrack`. Rules:

- Distance: haversine between consecutive points, summed.
- Elevation gain: only positive deltas **above a 2m noise floor** are counted — otherwise GPS jitter inflates numbers on flat ground.
- Average speed: total distance ÷ total active time (excludes paused segments).

## What's next for production

1. **Background location on mobile** — `Location.startLocationUpdatesAsync` with a TaskManager task so the tracker keeps recording when the app is backgrounded.
2. **Offline queueing** — buffer track points in SQLite/AsyncStorage and flush to Supabase when the network returns.
3. **Barometer elevation** on iOS — `expo-sensors` `Barometer` gives better altitude than GPS on phones that have it.
4. **Map rendering** — `activity_tracks` rows already store the full route; feed them to `react-native-maps` (mobile) or MapLibre/Mapbox (web) to draw the line.
5. **Route matching** — detect when an activity followed a known Minga expedition (Haversine distance from start / endpoint-matching) and auto-attribute it.
