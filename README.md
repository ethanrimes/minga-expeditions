# Minga Expeditions

Cross-platform traveler community and activity-tracking app for **Colombia**, built as a proof of concept for Giovanni & Sergio Andrés at Minga.

> **The pitch.** Travelers sign up, follow Minga's official expeditions, start their own, track GPS-recorded hikes and rides, rack up kilometers to earn tier badges (Bronze → Diamond), and discuss every expedition with threaded comments, likes, and 5-star ratings. Anyone can list their own expedition and charge a small access fee.

This repository is a **monorepo** with one Supabase backend and four clients:

| App                 | Location          | Purpose                                                                                                                              |
| ------------------- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| **Website**         | `apps/web`        | Desktop-first React + Vite marketing + full app site. What visitors see at `minga.co`.                                              |
| **Mobile debug UI** | `apps/mobile-web` | React + Vite + `react-native-web`. Renders the mobile screens inside a phone frame in a desktop browser, so we can iterate fast.    |
| **Mobile app**      | `apps/mobile`     | Expo / React Native. Real iOS + Android app that runs on device and uses `expo-location` for Strava-style GPS tracking.            |
| **Admin console**   | `apps/admin`      | Next.js 15 admin site for Minga staff. Manages categories, expeditions, vendor proposals, and (future) Wompi orders.                |

All three share a single Supabase project (auth, Postgres, storage) and **five shared TypeScript packages** (see [docs/architecture.md](docs/architecture.md)).

---

## Quick start

```bash
# 1. Clone & set up env files
./scripts/setup.sh

# 2. Apply the Postgres schema (requires the Supabase CLI)
./scripts/db-push.sh

# 3. Seed demo expeditions, users, photos, comments
./scripts/db-seed.sh        # or paste supabase/seed.sql into Supabase Studio

# 4. Launch whichever app you want
./scripts/dev-web.sh          # desktop site on http://localhost:5173
./scripts/dev-mobile-web.sh   # mobile-frame debug UI on http://localhost:5174
./scripts/dev-mobile.sh       # Expo — press i/a/w for iOS/Android/web
npm run dev:admin             # admin console on http://localhost:3100
```

For handover prep — env vars, account swap-out steps, and how to promote a
user to admin — see [HANDOVER.md](HANDOVER.md).

Windows contributors: run the scripts from **Git Bash** or **WSL**. Each script just wraps an `npm run dev:*` command, so `npm run dev:web` etc. work identically from PowerShell.

---

## Demo login

A pre-populated account ships with the seed — four GPS-tracked activities
(Chingaza run, Cocora loop, El Peñón de Guatapé, Monserrate), 122 track points,
likes / ratings / Spanish comments on the attended expeditions, and a profile
that reads as **680.4 km · 31,800 m elevation · Gold tier**.

| Field    | Value               |
| -------- | ------------------- |
| Email    | `demo@minga.co`     |
| Password | `MingaDemo2026!`    |

The account is (re)created by `scripts/seed-demo-user.mjs`. Idempotent — safe
to re-run; the script reads `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and
`SUPABASE_DB_URL` from env.

---

## Guest mode (use the app without signing in)

The app auto-calls `supabase.auth.signInAnonymously()` on boot so every
visitor gets a throwaway session and can like, comment, rate and record
activities without filling in a signup form. A real sign-in later
"upgrades" that anonymous account.

This requires one dashboard toggle on the Supabase project:

1. Go to **Supabase → your project → Auth → Providers**
2. Enable **Allow anonymous sign-ins**
3. Save

If you leave it off, the code fails silently (no crash) and the old
"sign in to comment / like / track" gates remain in place.

---

## What's working

- ✅ **Auth** — email+password via Supabase auth. Google & Meta login are stubbed (API keys pending).
- ✅ **Feed, filtering, and expedition detail** — threaded comments, likes, 5-star ratings.
- ✅ **Strava-style GPS tracking** — browser (`navigator.geolocation`) on web, `expo-location` on mobile. Summarizes distance, elevation gain, pace, and avg speed.
- ✅ **Tier system** — Bronze / Silver / Gold / Diamond, computed from `total_distance_km`. A Postgres trigger recomputes profile totals after every activity insert.
- ✅ **Theme toggle** — three themes including `livehappy` (the bright-orange livehappy.com palette Giovanni asked for), `minga-green`, and `midnight` (dark mode).
- ✅ **Demo seed** — 5 presenter profiles, 10 expeditions (Ciudad Perdida, Valle de Cocora, Alto de Letras, etc.), threaded comments, likes, ratings, with **photographer attribution** for every Unsplash image.
- ✅ **Row-Level Security** on every user-facing table. See [docs/supabase.md](docs/supabase.md).

## Known limitations (PoC scope)

- Google / Meta OAuth buttons are not wired — add keys in the Supabase dashboard when you have them, then drop in `supabase.auth.signInWithOAuth({ provider: 'google' })`.
- Background location on mobile is declared in `app.json` but not yet implemented (`Location.startLocationUpdatesAsync` in a TaskManager).
- Map rendering of tracked routes is not included — the raw points are stored in `activity_tracks`, ready to feed to `react-native-maps` / Mapbox GL.
- Payments for paid expeditions are display-only (`price_cents` on each row).

---

## Repository layout

```
minga-app/
├── apps/
│   ├── web/            desktop Vite + React + react-router
│   ├── mobile-web/     Vite + react-native-web (phone-frame debug UI)
│   └── mobile/         Expo React Native
├── packages/
│   ├── types/          domain + DB row shapes
│   ├── supabase/       client factory + all query helpers
│   ├── theme/          tokens + ThemeProvider + 3 palettes
│   ├── logic/          tier math, formatters, geo (haversine, track summary)
│   └── ui/             cross-platform components, screens, hooks (shared by mobile-web + mobile)
├── supabase/
│   ├── migrations/     schema + RLS (applied via `supabase db push`)
│   └── seed.sql        idempotent demo data
├── scripts/            dev runners + db push/seed
└── docs/               architecture, supabase, tracking, theming
```

---

## Further reading

- [docs/architecture.md](docs/architecture.md) — how the monorepo is wired and what each package does
- [docs/supabase.md](docs/supabase.md) — schema, RLS, triggers, seeding
- [docs/credentials.md](docs/credentials.md) — step-by-step for obtaining the missing dev credentials (Wompi sandbox, Supabase CLI, OAuth, WhatsApp)
- [docs/tracking.md](docs/tracking.md) — how Strava-style GPS tracking works, and how to extend it
- [docs/theming.md](docs/theming.md) — theme tokens and how to add a new theme
