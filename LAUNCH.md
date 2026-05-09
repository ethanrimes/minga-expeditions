# Minga Expeditions — Launch & Test Runbook

This is the playbook for taking the repo from a fresh clone to a working
end-to-end staging environment, then verifying every phase. Follow it once
top-to-bottom and the platform is online.

> **Audience.** You (the developer). For the prod handover to Minga, see
> [`HANDOVER.md`](./HANDOVER.md).

---

## 0 · Prerequisites

Provision these once before you start:

| # | Service | What to grab |
|---|---|---|
| 1 | **Node 20+** + **npm 10+** | local |
| 2 | **Supabase CLI** | `npm i -g supabase` |
| 3 | **Supabase project** (Free plan is fine for staging) | Project URL, anon key, service role key, DB connection string |
| 4 | **Wompi sandbox account** | Public key, integrity key, events secret |
| 5 | **Google Cloud OAuth client** | Web application; redirect `https://<supabase-url>/auth/v1/callback` |
| 6 | **Meta for Developers app** with Facebook Login + WhatsApp products | Facebook OAuth app id/secret; WhatsApp permanent system-user token; WhatsApp phone-number id |
| 7 | **Domain or tunnel** for the marketing site | Anything reachable from Wompi's webhook (Vercel preview, ngrok, fly.io, etc.) |

---

## 1 · Repo bootstrap

```powershell
# Clone (you've already done this)
cd F:\minga-app

# Install all workspaces
npm install

# Verify the workspace registers @minga/admin
npm ls --workspaces --depth 0
```

Copy every `.env.example` to its real file. None of the example files
contain secrets:

```powershell
Copy-Item apps\admin\.env.example apps\admin\.env.local
Copy-Item apps\web\.env.example apps\web\.env
Copy-Item apps\mobile\.env.example apps\mobile\.env
Copy-Item apps\mobile-web\.env.example apps\mobile-web\.env
```

You'll fill these in during the steps below.

---

## 2 · Database

### 2.1 — Link the CLI to your Supabase project

```powershell
supabase login
supabase link --project-ref <your-project-ref>
```

`<your-project-ref>` is the alphanumeric prefix in your Supabase URL
(`https://<ref>.supabase.co`).

### 2.2 — Run migrations

```powershell
supabase db push
```

This applies, in order:

| Migration | What it adds |
|---|---|
| `20260416_000100_init_schema.sql` | Profiles, expeditions, activities, comments, likes, ratings |
| `20260416_000200_rls_policies.sql` | RLS for the above |
| `20260417_000100_activity_feedback.sql` | Activity comments + ratings |
| `20260417_000200_guest_profiles.sql` | Anonymous-signup safety net |
| `20260508_000100_roles_and_categories.sql` | `app_role`, `categories`, admin RLS, `expedition-photos` bucket |
| `20260508_000200_vendor_proposals.sql` | Vendor proposals + admin RLS |
| `20260508_000300_orders_and_guests.sql` | `guest_contacts`, `orders`, account-claim trigger |
| `20260508_000400_activity_photos_and_tags.sql` | `terrain_tags`, `activity_photos`, `activity-photos` bucket |

### 2.3 — Seed demo data (optional but recommended)

```powershell
$env:SUPABASE_DB_URL = "postgres://postgres:<password>@db.<ref>.supabase.co:5432/postgres"
psql $env:SUPABASE_DB_URL -f supabase\seed.sql
node scripts\seed-demo-user.mjs    # creates demo@minga.co / MingaDemo2026!
```

### 2.4 — Promote yourself to admin

You must sign up first via any client so a `profiles` row exists. The
fastest way is `apps/web` after step 4. Once you have an account, in the
Supabase SQL editor:

```sql
update public.profiles
   set role = 'admin'
 where username = '<your-username>';
```

Verify:

```sql
select username, role from public.profiles where role = 'admin';
```

---

## 3 · Edge Functions

### 3.1 — Set the function secrets

In the Supabase dashboard → **Edge Functions → Secrets**, add:

```
WOMPI_PUBLIC_KEY        = pub_test_...
WOMPI_INTEGRITY_KEY     = test_integrity_...
WOMPI_EVENTS_SECRET     = test_events_...
PUBLIC_SITE_URL         = http://localhost:5173      # the apps/web origin
WHATSAPP_TOKEN          = <Meta system-user token>
WHATSAPP_PHONE_ID       = <Meta phone-number id>
```

`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are auto-populated by Supabase
— do **not** set them manually.

### 3.2 — Deploy the functions

```powershell
supabase functions deploy wompi-create-order
supabase functions deploy wompi-webhook
supabase functions deploy wompi-order-status
supabase functions deploy whatsapp-send
supabase functions deploy activity-share-card
```

After deploy, your function URLs are:

```
https://<ref>.supabase.co/functions/v1/wompi-create-order
https://<ref>.supabase.co/functions/v1/wompi-webhook
https://<ref>.supabase.co/functions/v1/wompi-order-status
https://<ref>.supabase.co/functions/v1/whatsapp-send
https://<ref>.supabase.co/functions/v1/activity-share-card
```

### 3.3 — Smoke test each function

```powershell
# Sanity ping the share-card function (no auth needed; public route)
curl "https://<ref>.supabase.co/functions/v1/activity-share-card?activity_id=00000000-0000-0000-0000-000000000000" `
  -i
# Expect 404 "not found" — proves the function is reachable.

# Order status (will 404 unless you pass a real order id)
curl -X POST "https://<ref>.supabase.co/functions/v1/wompi-order-status" `
  -H "Content-Type: application/json" `
  -d '{"orderId":"00000000-0000-0000-0000-000000000000"}'
```

---

## 4 · Wompi configuration

In the Wompi merchant dashboard:

1. **Eventos (events)** → enable → set the URL to
   `https://<ref>.supabase.co/functions/v1/wompi-webhook`.
2. Copy the **Llave de eventos** (events secret) into the Supabase
   `WOMPI_EVENTS_SECRET`.
3. Go to **Llaves API** → copy **Llave pública** + **Llave de integridad**
   into `WOMPI_PUBLIC_KEY` / `WOMPI_INTEGRITY_KEY`.
4. Set `apps/web/.env`:

   ```
   VITE_SUPABASE_URL=https://<ref>.supabase.co
   VITE_SUPABASE_ANON_KEY=sb_publishable_...
   VITE_WOMPI_PUBLIC_KEY=pub_test_...
   ```

> Test mode uses Wompi's sandbox card `4242 4242 4242 4242`, any future
> expiry, CVV `123`. Approved transactions arrive in the webhook within a
> few seconds.

---

## 5 · OAuth providers

In the Supabase dashboard → **Authentication → Providers**:

| Provider | What to paste |
|---|---|
| Google | Client ID + Client Secret from Google Cloud OAuth |
| Facebook | App ID + App Secret from Meta for Developers |

Both providers need this redirect URL configured on the provider's side:
`https://<ref>.supabase.co/auth/v1/callback`

---

## 6 · WhatsApp Cloud API

In **Meta for Developers → WhatsApp**:

1. Create a permanent system-user token with the `whatsapp_business_messaging`
   scope. Paste into `WHATSAPP_TOKEN`.
2. Note your test sender's **Phone number ID**. Paste into `WHATSAPP_PHONE_ID`.
3. Create an **approved template** named `order_confirmation` in `es_CO`
   with two body variables `{{1}}` and `{{2}}` (expedition title and amount).
   Until the template is approved, WhatsApp confirmations will fall back to
   silent-fail (the order still saves).
4. Add your test recipient WhatsApp number to the allowed list (sandbox
   restriction; production uses approved templates only).

---

## 7 · Local dev — run each app

Open four terminals, one per app. None of these need to run simultaneously
unless you're testing cross-surface flows.

### 7.1 — Marketing site (`apps/web`)

```powershell
npm run dev:web
# http://localhost:5173
```

### 7.2 — Admin console (`apps/admin`)

```powershell
npm run dev:admin
# http://localhost:3100
```

### 7.3 — Mobile (Expo)

```powershell
npm run dev:mobile
# Press i (iOS sim), a (Android), or w (web)
```

If your IP changes, restart the server so device clients pick up the new
LAN address.

### 7.4 — Mobile-frame debug UI (optional)

```powershell
npm run dev:mobile-web
# http://localhost:5174
```

Useful for fast UI iteration without an emulator.

---

## 8 · End-to-end test plan

Run through each phase top-to-bottom. Tick each line as it passes.

### Phase 0 — Foundations

- [ ] `select * from public.categories;` returns 7 seeded rows.
- [ ] `select role from public.profiles where username = '<you>';` returns `admin`.
- [ ] `\dx` shows `expedition-photos` and `activity-photos` buckets exist
      in **Storage**.

### Phase 1 — Admin console

- [ ] `http://localhost:3100/login` → sign in with admin creds → lands on
      `/`.
- [ ] Sign in with a NON-admin account → redirected back to `/login` with
      "not authorized for the admin dashboard."
- [ ] **Categories**: create a new category "Coffee tour" (slug
      `coffee-tour`). Edit it. Toggle `is_active`. List page reflects
      changes.
- [ ] **Expeditions**: create a new expedition linked to "Coffee tour".
      Upload a cover photo. Open the row in the public mobile app and the
      photo loads.
- [ ] Try to delete the "Coffee tour" category while the expedition still
      uses it → expect "violates foreign key constraint" error (RLS lets
      us through; the FK blocks). Soft-disable instead by clearing
      `is_active`.

### Phase 2 — Vendor proposals

- [ ] On `apps/web` → `/partners` → submit a proposal as a vendor (no
      sign-in). Confirmation message appears.
- [ ] In `apps/admin` → `/vendor-proposals` → the new submission shows in
      the **New** queue.
- [ ] Open the detail page → save an internal note → change status to
      **Accepted** → list page shows updated status. Trigger should have
      stamped `reviewed_by` + `reviewed_at`.
- [ ] Submit again with the same email/phone → rows are independent (vendor
      proposals are not deduped). Expected.

### Phase 3 — Wompi guest checkout

- [ ] Pick a paid expedition (`price_cents > 0`) on `apps/web` →
      `/expeditions/<id>` → click **Book this expedition**.
- [ ] Drawer opens. Fill in name + email + phone → **Pay with Wompi**.
- [ ] Wompi widget opens. Use sandbox card `4242 4242 4242 4242`.
- [ ] Browser redirects to `/orders/<id>/success`. Title shows
      "Confirming your payment…" then flips to "Payment confirmed" within
      a few seconds.
- [ ] In `apps/admin` → `/orders` → row shows `approved`, with the guest's
      email.
- [ ] In Supabase SQL editor:

      ```sql
      select status, paid_at, wompi_transaction_id from orders
      order by created_at desc limit 1;
      ```

      Status is `approved` and `paid_at` is set.
- [ ] **Account-claim**: now sign up on `apps/web` with the same email
      you used as a guest. After signup, run:

      ```sql
      select claimed_by_profile_id from guest_contacts where email = '<that email>';
      ```

      The `claimed_by_profile_id` is set to your new profile id, and:

      ```sql
      select buyer_profile_id, buyer_guest_contact_id from orders
      order by created_at desc limit 1;
      ```

      `buyer_profile_id` is now your id (the trigger re-linked it).

### Phase 4 — OAuth + WhatsApp delivery

- [ ] On `apps/web/auth` → **Continue with Google** → redirects through
      Google → returns to `/profile` signed-in.
- [ ] **Continue with Facebook** → same.
- [ ] Trigger another paid Wompi purchase using a phone number on the
      WhatsApp test list. After approval, you receive an `order_confirmation`
      WhatsApp message with title + amount substituted.
- [ ] Edge Function logs in Supabase dashboard show no errors.

### Phase 5 — Strava-style activity polish

- [ ] In the mobile app, navigate to **Track**. Above the start button you
      see `Linked to: Independent` plus a chip per purchased expedition.
- [ ] Start a track, walk around or fake some movement, **Finish**.
- [ ] Stop screen shows a **Terrain** chip group. Pick "mountain" + "river".
      Save the activity.
- [ ] In Supabase: `select terrain_tags, is_independent from activities
      order by created_at desc limit 1;` → values match what you picked.
- [ ] Open the activity detail screen → tap **Add photo** → grant photo
      access → pick an image → it appears in the gallery.
- [ ] `select count(*) from activity_photos where activity_id = '<id>';`
      → returns 1.

### Phase 6 — Social sharing

- [ ] On the activity detail screen, tap **Share**. Native share sheet
      opens with WhatsApp / Instagram / Facebook / Save Image options.
- [ ] Visit
      `https://<ref>.supabase.co/functions/v1/activity-share-card?activity_id=<id>`
      in a browser → an SVG with the route + stats renders.
- [ ] Try sharing to a WhatsApp chat → the SVG arrives as an attachment.

---

## 8.5 · Running the unit-test suite

Tests are colocated next to the modules they cover. There are two stacks
because the mobile app needs `jest-expo` for native-module mocking, while
everything else runs on Vitest.

```powershell
# Everything runs in parallel (one package at a time but each is fast)
npm run test

# Or one workspace at a time
npm run test:logic         # @minga/logic    — formatters, tier math, geo
npm run test:supabase      # @minga/supabase — query helpers with a fake client
npm run test:admin         # @minga/admin    — form parsers + requireAdmin guard
npm run test:mobile        # @minga/mobile   — photoPicker / shareAdapter / locationAdapter
```

What's covered:

| Suite | Highlights |
|---|---|
| `@minga/logic` | All `formatX` formatters (km, m, duration, pace, speed, COP), tier promotion thresholds, haversine distance correctness vs. real city pairs, track summarisation including the 2-metre elevation noise floor. |
| `@minga/supabase` | A fake fluent client (`src/test-utils.ts`) records every chained call. Tests assert that filters land where they should, that `submitVendorProposal` enforces the contact-method rule, that `saveActivity` derives `is_independent` and `avg_speed_kmh` correctly, that `fetchMyPurchasedExpeditions` dedupes, that `vendorProposalCounts` / `orderCounts` aggregate per status. |
| `@minga/admin` | `parseCategoryForm` slug regex + i18n required-fields rule. `parseExpeditionFormFields` numeric coercion (blank → `null`, not `NaN`), difficulty clamp, currency upper-casing, checkbox semantics. `requireAdmin` redirects in every failure mode and returns the session for admins. |
| `@minga/mobile` | `photoPicker` permission/cancel/EXIF/missing-filename branches. `shareAdapter` no-op-when-unsupported, success path, deep-link fallback when the SVG download fails. `locationAdapter` permission denied, point shape, null altitude/speed handling, stop unsubscription. |

If a Vitest run reports `Cannot find module 'vite-tsconfig-paths'`, run
`npm install` again — that plugin is what lets the admin tests resolve the
`@/lib/...` aliases declared in `tsconfig.json`.

---

## 9 · Common failure modes

| Symptom | Likely cause | Fix |
|---|---|---|
| Login form on `apps/admin` accepts your password but kicks back to `/login?error=not_admin` | You haven't promoted your profile yet (step 2.4) | Run the SQL update |
| Wompi widget opens but redirects fail | `PUBLIC_SITE_URL` Edge-Function secret is wrong | Update + redeploy |
| `wompi-webhook` returns 401 | Events secret mismatch between Wompi dashboard + Supabase secrets | Re-copy from Wompi |
| WhatsApp confirmations silent in dev | Recipient not on the test list or template not approved | Add the number in Meta dashboard, approve template |
| Mobile app crashes with `Property 'Icon' doesn't exist` | Stale Metro cache after a package change | `npx expo start -c` |
| Categories not appearing in mobile | Mobile still reads the legacy `category` enum column. The trigger keeps it in sync — try `select category, category_id from expeditions limit 5;` to confirm | Re-run admin save to nudge the trigger |
| `npm run dev:admin` fails with "Cannot find module '@minga/supabase'" | Workspace install incomplete | Re-run `npm install` from repo root |

---

## 10 · Production checklist

When you're ready to flip from staging to prod:

- [ ] Wompi dashboard → switch to live keys. Update Supabase Edge-Function
      secrets to match.
- [ ] OAuth: replace Google + Facebook clients with prod credentials.
- [ ] WhatsApp: graduate from sandbox to a verified business profile.
- [ ] `PUBLIC_SITE_URL` Edge-Function secret → your real domain.
- [ ] `apps/web` `.env` → real domain origin.
- [ ] Mobile EAS build with prod env: `eas build -p ios --profile production`.
- [ ] Verify the entire test plan again on prod accounts.
- [ ] In `HANDOVER.md` § "Adding the developer (you) as admin on the prod
      project" — run that SQL once Minga has finished the swap-out.

You're live.
