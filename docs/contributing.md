# Contributing

## Dev loop

1. **Pick which surface you're iterating on.**
   - Data model / RLS / seed → edit under `supabase/` then re-run `db-push.sh` / `db-seed.sh`.
   - Business logic → edit under `packages/logic/` (and add tests under `packages/logic/__tests__/` when ready to introduce a runner).
   - Shared UI → edit under `packages/ui/`; live-reload works in `apps/mobile-web` immediately and in the Expo app via Metro.
   - Desktop-only UI → edit under `apps/web/`.
   - Mobile-only UI → edit under `apps/mobile/`.

2. **Preview in the fastest possible surface.** Giovanni found the Android emulator slow, so use `apps/mobile-web` as the first place to see new mobile screens.

3. **Typecheck.** `npm run typecheck` runs `tsc --noEmit` on every workspace that has the script.

## Commit style

Conventional, but informal: `feat:`, `fix:`, `docs:`, `refactor:` prefixes are fine. Keep subject lines ≤72 chars. The PR description is the place for longer context.

## Issues & ideas

Track work under GitHub Issues in `ethanrimes/minga-expeditions`. Suggested labels: `good-first`, `schema`, `tracking`, `ui`, `infra`.

## Future work roadmap

- **Auth providers** — Google, Meta (API keys pending from Giovanni).
- **Paid expeditions** — Stripe Connect so listing authors can monetize.
- **Maps** — `react-native-maps` for mobile, MapLibre/Mapbox GL for web. Render `activity_tracks` lines and expedition start points.
- **Push notifications** — Expo Notifications for "someone commented on your expedition".
- **Background tracking** — Expo TaskManager + `startLocationUpdatesAsync` so tracking survives app backgrounding.
- **Image uploads** — Supabase Storage bucket for user-uploaded expedition covers; a signed upload flow from the clients.
- **Search** — full-text search on `expeditions.title + description` via Postgres trigram/tsvector.
