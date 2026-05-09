# Minga Expeditions — Handover Checklist

This repo is built so a single deployment talks to **one** set of accounts (one
Supabase project, one Wompi merchant account, one storage bucket, one OAuth
client per provider). To hand the platform off to Minga Expeditions, you swap
the env vars in each app and redeploy. There is no runtime-switchable tenancy
and no hardcoded credential anywhere in the source tree.

## What Minga Expeditions needs to provision

| # | Service | Owner-facing action | Where the value lives |
|---|---|---|---|
| 1 | **Supabase project** (Pro plan recommended) | New project in their org → run `npm run db:push` against it → run `supabase/seed.sql` if they want demo data | `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` |
| 2 | **Wompi merchant account** | Already exists. Generate production keys + configure webhook URL pointing at the Edge Function | `WOMPI_PUBLIC_KEY`, `WOMPI_INTEGRITY_KEY`, `WOMPI_EVENTS_SECRET` |
| 3 | **Google OAuth client** | Google Cloud → OAuth 2.0 → web app. Authorized redirect: `https://<supabase-url>/auth/v1/callback` | Pasted into Supabase dashboard (Authentication → Providers → Google) |
| 4 | **Facebook (Meta) OAuth app** | Meta for Developers → consumer app → Facebook Login. Same redirect URL as above | Same — pasted into Supabase dashboard |
| 5 | **WhatsApp Cloud API access** | Meta for Developers → WhatsApp → permanent system user token + phone number ID | `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_ID` (Edge Function env) |
| 6 | **Mobile app stores** | Apple App Store + Google Play developer accounts. EAS profile updated with their bundle id | `apps/mobile/app.json`, `eas.json` |
| 7 | **Sentry project** (optional) | New Sentry project | `SENTRY_DSN` in `apps/mobile/App.tsx` env wiring |
| 8 | **Hosting** | Pick one — Vercel for `apps/admin`, EAS for mobile. Mobile-web (Vite) can go on Cloudflare Pages | n/a |
| 9 | **Custom domain + email sender** | DNS for the admin site + a transactional email sender (Postmark/Resend) wired into Supabase SMTP | Supabase dashboard SMTP config |

## Where credentials live in this repo

Every secret is loaded from environment variables. There are **no** credentials
checked into git. The previous Supabase anon key was scrubbed in commit
`ef52319`.

```
apps/admin/.env.local              # Next.js admin (server + browser)
apps/mobile/.env                   # Expo mobile (loaded at build time)
apps/web/.env                      # Vite marketing site
apps/mobile-web/.env               # Vite mobile-web build
supabase/.env                      # Local CLI only (DB url, service role)
```

Each `.env` file has a sibling `.env.example` with the keys but no values.
**Never commit a real `.env`** — `.gitignore` already excludes them.

## Swap-out procedure (running through it once)

1. Minga creates a fresh Supabase project, gets `SUPABASE_URL` + `SUPABASE_ANON_KEY` + `SERVICE_ROLE_KEY`.
2. Run migrations: `SUPABASE_DB_URL=<their-db-url> npx supabase db push`.
3. Seed demo data only if they want it: `psql $SUPABASE_DB_URL -f supabase/seed.sql`.
4. Promote a real account to admin (one-time, run in their SQL editor):
   ```sql
   update public.profiles set role = 'admin' where username = 'minga.official';
   ```
5. Update env files in each app (`.env.local` for admin, `.env` for the others).
6. Wompi: replace public/integrity keys, update webhook URL to the new admin host.
7. OAuth: configure Google + Facebook providers in the new Supabase dashboard.
8. Storage: the `expedition-photos` bucket is created by the migration. Nothing manual to do.
9. Redeploy each app. Mobile requires a new EAS build because env vars are bundled at build time.

## Adding the developer (you) as admin on the prod project

After Minga has provisioned everything, they run this in their SQL editor:

```sql
update public.profiles
   set role = 'admin'
 where username = '<your-username>';
```

You sign in with the same email you used during dev — your auth user
propagates a `profiles` row via the `on_auth_user_created` trigger, then the
update above flips your role.

## Edge Functions to deploy

The repo ships these Supabase Edge Functions (`supabase/functions/<name>`).
Deploy each with `supabase functions deploy <name>`. All require the env vars
set on the Supabase dashboard (Edge Functions → Secrets).

| Function | Purpose | Required env |
|---|---|---|
| `wompi-create-order` | Browser-callable. Creates a pending `orders` row + signed widget config. | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `WOMPI_PUBLIC_KEY`, `WOMPI_INTEGRITY_KEY`, `PUBLIC_SITE_URL` |
| `wompi-webhook` | Server→server. Verifies the event signature and updates the order. Triggers WhatsApp confirmation on approval. | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `WOMPI_EVENTS_SECRET` |
| `wompi-order-status` | Browser-callable. Returns minimal order info for the success polling page. | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` |
| `whatsapp-send` | Service-role only. Sends template messages via WhatsApp Cloud API. | `SUPABASE_SERVICE_ROLE_KEY`, `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_ID` |
| `activity-share-card` | Public GET. Renders an SVG share card from an activity. | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` |

The Wompi webhook URL pasted into the Wompi merchant dashboard is:
`https://<your-supabase-url>/functions/v1/wompi-webhook`

## Translation backlog

Some Phase-2/3 marketing-site strings (the `/partners` form, the checkout
drawer, the order-success page) are hardcoded English. They should be
folded into `packages/i18n` before going live in Spanish-only markets. Search
the codebase for the comment `i18n` / `inline` to find them.

## What's role-gated where

- **`profiles.role = 'admin'`** — full admin web app access, can write categories, write any expedition, upload photos.
- **`profiles.role = 'vendor'`** — can submit + read their own vendor proposals (Phase 2).
- **`profiles.role = 'user'`** — default. Mobile app users.

The check happens in two places:
1. The Next.js admin app gate (`apps/admin/src/lib/auth.ts`) redirects
   non-admins to `/login`.
2. Postgres RLS via `public.is_admin()` enforces it at the DB level so even a
   leaked anon key cannot bypass admin-only writes.
