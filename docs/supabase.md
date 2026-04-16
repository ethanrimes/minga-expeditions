# Supabase backend

Project ref: `dgkmvoteliomghoctwrd` · URL: `https://dgkmvoteliomghoctwrd.supabase.co`

## Schema

See `supabase/migrations/20260416_000100_init_schema.sql`.

```
profiles (id, username, display_name, avatar_url, bio, home_country,
          total_distance_km, total_elevation_m, tier, timestamps)
  │
  ├── expeditions (id, author_id, title, description, category, location_name,
  │               region, country, coords, distance_km, elevation_gain_m,
  │               difficulty, price_cents, currency, cover_photo_url,
  │               is_official, is_published, timestamps)
  │     ├── expedition_photos (url, caption, order_index, attribution_id)
  │     ├── comments (threaded via parent_id → comments.id)
  │     ├── likes  (user_id, expedition_id)
  │     └── ratings (user_id, expedition_id, stars, review)
  │
  └── activities (title, type, started_at, ended_at, distance_km,
        │         elevation_gain_m, duration_seconds, avg_speed_kmh, notes)
        └── activity_tracks (lat, lng, altitude_m, speed_ms, sequence)

photo_attributions (photographer_name, source_url, license, …)
```

### Enums

- `expedition_category`: `hiking · cycling · running · trekking · cultural · wildlife · other`
- `tier_level`: `bronze · silver · gold · diamond`
- `activity_type`: `hike · ride · run · walk`

### Triggers

- `on_auth_user_created` (on `auth.users` insert) — mirrors the new sign-up into `public.profiles`, generating a unique username from metadata or email.
- `profiles_touch` / `expeditions_touch` — auto-update `updated_at`.
- `activities_totals_sync` — after any activity insert/update/delete, recompute the owner's `total_distance_km`, `total_elevation_m`, and `tier`.

### Tier thresholds

| Tier    | Threshold (km)   |
| ------- | ---------------- |
| Bronze  | 0                |
| Silver  | 100              |
| Gold    | 500              |
| Diamond | 2000             |

Defined once in `packages/logic/src/tier.ts` **and** in the `refresh_profile_totals` function — change both together.

## Row-Level Security

See `supabase/migrations/20260416_000200_rls_policies.sql`. RLS is **enabled on every table**.

Summary:

- **Publicly readable** — `profiles`, published `expeditions` (+ their `expedition_photos`), `photo_attributions`, `comments`, `likes`, `ratings`.
- **Private per-user** — `activities`, `activity_tracks`. Only the owner can read/write their own rows.
- **Writes** always check `auth.uid() = <owning column>`. Cross-table checks (e.g., comments.author_id must match auth.uid) use `with check` predicates.

## Applying the schema

```bash
./scripts/db-push.sh
```

This runs `supabase db push` against the session-pooler connection string (the direct `db.<ref>.supabase.co` host only accepts IPv6 from this network).

Prefer the UI? Open Studio → Database → Migrations and paste each `.sql` file in `supabase/migrations/`.

## Seeding

```bash
./scripts/db-seed.sh
```

The seed is **idempotent** — re-running upserts. It populates:

- 10 photographer attribution rows (Unsplash contributors)
- 5 presenter profiles (Minga official, Juliana, Andrés, Carolina, Lucas)
- 10 expeditions across all 6 categories
- 10 gallery photos with attribution links
- 8 threaded comments (including replies)
- 10 likes, 8 ratings
- 3 demo activities for profile tier progress
- Final overrides on profile totals so the demo profiles look like "a year of travel" rather than just the three seeded activities

If `psql` isn't available, paste `supabase/seed.sql` into **Studio → SQL Editor**.

## Adding a migration

1. Create a timestamped file in `supabase/migrations/`: `YYYYMMDD_HHMMSS_description.sql`.
2. Write forward-only SQL (we don't maintain `down` migrations for a PoC).
3. Push via `./scripts/db-push.sh`.
4. Update the TypeScript row types in `packages/types/src/db.ts`.
5. If the query surface changed, update `packages/supabase/src/queries.ts`.
