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

## Wiring up Google + Meta (Facebook / Instagram) sign-in

Email + password works out of the box. To turn on the **Continue with
Google** and **Continue with Facebook** buttons in `apps/web/auth`, you
have to provision OAuth credentials with each provider, paste them into
the Supabase dashboard, and add the Supabase callback URL on the
provider's side.

The Supabase callback URL is the same for every provider:

```
https://<your-project-ref>.supabase.co/auth/v1/callback
```

Find `<your-project-ref>` in any of your `.env.local` files (the
`SUPABASE_URL` host). Keep this URL handy — you'll paste it at least twice.

### Google

1. **Open Google Cloud Console** — <https://console.cloud.google.com/>.
   Sign in with the Google account that should own the OAuth client (for
   handover, this should be a `@minga.co` account, not your personal one).
2. **Create or pick a project.** Top-left project switcher → **New
   Project** → name it `minga-prod` (or similar). Wait for the green
   "project created" toast, then switch to it.
3. **Configure the OAuth consent screen.**
   - Left nav → **APIs & Services → OAuth consent screen**.
   - User type: **External**. (Internal is only available on Workspace
     orgs.) Click **Create**.
   - App name: `Minga Expeditions`. User support email + developer
     contact: a real inbox you read.
   - Logo: optional in test mode, required for production.
   - **Scopes**: click **Add or remove scopes** → tick `.../auth/userinfo.email`,
     `.../auth/userinfo.profile`, and `openid`. Save & continue.
   - **Test users**: while the app is in "Testing" mode, only listed
     emails can sign in. Add yourself + Giovanni. Skip when you publish.
   - Save and exit. You can leave the app in **Testing** mode indefinitely
     for the PoC — there's no rate-limit downside.
4. **Create the OAuth 2.0 Client ID.**
   - Left nav → **APIs & Services → Credentials → Create Credentials →
     OAuth client ID**.
   - Application type: **Web application**.
   - Name: `minga-web` (anything).
   - **Authorized JavaScript origins** — optional but recommended. Add
     `http://localhost:5173` for dev and your prod domain for prod.
   - **Authorized redirect URIs** — paste the Supabase callback URL
     exactly: `https://<your-project-ref>.supabase.co/auth/v1/callback`.
     **This must match character-for-character; trailing slashes break
     the flow.**
   - Click **Create**. Copy the **Client ID** and **Client secret** from
     the dialog (you can also re-download later from the Credentials list).
5. **Paste into Supabase.**
   - Supabase dashboard → your project → **Authentication → Providers →
     Google**.
   - Toggle **Enable Sign in with Google**.
   - Paste **Client ID** and **Client Secret**.
   - **Skip nonce check**: leave off unless you have a specific reason.
   - **Authorized Client IDs**: only relevant if you're also using Google
     One-Tap from a mobile app — leave empty for the web flow.
   - Click **Save**.
6. **Smoke test.** From `apps/web/auth`, click **Continue with Google**.
   You should bounce to Google, pick an account, and land back on
   `/profile` signed in. If the redirect 400s with `redirect_uri_mismatch`,
   you have an extra slash or wrong ref in either side — fix and retry.

### Meta (Facebook + Instagram)

Supabase has a single **Facebook** provider that covers Facebook accounts
and — because Meta unified Instagram logins under the same identity
system — most personal Instagram users as well. There is no separate
"Instagram" Supabase provider; if your users primarily have IG-only
accounts (no linked Facebook), they're prompted to create / link a
Facebook profile during the OAuth flow.

1. **Open Meta for Developers** — <https://developers.facebook.com/>.
   Sign in with the Facebook account that should own the app. For
   handover, this should be Giovanni's Facebook account tied to the
   business page.
2. **Create the app.**
   - Top-right → **My Apps → Create App**.
   - Use case: **Authenticate and request data from users with Facebook
     Login**. (If Meta presents only the legacy "Consumer / Business"
     picker, pick **Consumer**.)
   - App name: `Minga Expeditions`. Contact email: a real inbox.
   - **App type / business portfolio**: pick "I don't want to connect a
     business portfolio" for now; you can attach one later before going
     live.
3. **Add the Facebook Login product.**
   - On the app dashboard, under **Add products to your app**, find
     **Facebook Login** → **Set up**.
   - Pick **Web** as the platform when prompted; site URL
     `http://localhost:5173` (you'll add prod later). You can skip the
     SDK quickstart — Supabase handles the flow.
4. **Configure OAuth redirect.**
   - Left nav → **Facebook Login → Settings**.
   - **Valid OAuth Redirect URIs**: paste
     `https://<your-project-ref>.supabase.co/auth/v1/callback`.
   - **Client OAuth Login**: ON.
   - **Web OAuth Login**: ON.
   - **Enforce HTTPS**: ON (Supabase's callback is HTTPS).
   - Save changes.
5. **Grab credentials.**
   - Left nav → **App settings → Basic**.
   - Copy **App ID** and click "Show" on **App Secret** to reveal it.
   - While you're here, fill in **Privacy Policy URL** and **Terms of
     Service URL**. Required before Meta lets the app leave Development
     mode. For the PoC, pointing them at `minga.co/privacy` /
     `minga.co/terms` (even stubs) is enough to keep the app moving.
6. **Paste into Supabase.**
   - Supabase dashboard → **Authentication → Providers → Facebook**.
   - Toggle **Enable Sign in with Facebook**.
   - Paste **Facebook client ID** (the App ID) and **Facebook secret**.
   - Save.
7. **Add test users (while in Development mode).**
   - On the Meta app dashboard → **App roles → Roles → Add People**.
   - Add yourself + Giovanni as **Testers**. Each invitee must accept
     from their own Facebook inbox before they can log in.
   - Without this, OAuth returns an error like "App not active" or
     "submit for review" — Meta is just refusing logins from
     unauthorised accounts.
8. **Smoke test.** From `apps/web/auth`, click **Continue with Facebook**
   → bounce to Facebook, approve scopes (`email`, `public_profile`),
   land back at `/profile` signed in.
9. **(Later) Going live.** Before non-testers can use the button you
   must:
   - Click **App Review → Permissions and Features** and request
     `email` + `public_profile` (both are usually approved
     automatically).
   - Submit the app for review and toggle **App Mode** to **Live** at
     the top of the dashboard. Meta will only let you flip the toggle
     once business verification + privacy URLs are filled.

### Where the OAuth keys live

Unlike the Wompi or WhatsApp keys, Google + Facebook credentials live
**only** in the Supabase dashboard — there is nothing to set in `.env`,
nothing to deploy as Edge Function secrets, and nothing to bake into
client bundles. The Supabase auth gateway proxies the entire flow on the
clients' behalf.

For the prod handover, [`HANDOVER.md`](../HANDOVER.md) covers swapping
these out — Giovanny creates new Google + Meta apps in his own
accounts, pastes them into his prod Supabase project, and you delete
yours.

## Future work roadmap

- **Paid expeditions** — Stripe Connect so listing authors can monetize.
- **Maps** — `react-native-maps` for mobile, MapLibre/Mapbox GL for web. Render `activity_tracks` lines and expedition start points.
- **Push notifications** — Expo Notifications for "someone commented on your expedition".
- **Background tracking** — Expo TaskManager + `startLocationUpdatesAsync` so tracking survives app backgrounding.
- **Image uploads** — Supabase Storage bucket for user-uploaded expedition covers; a signed upload flow from the clients.
- **Search** — full-text search on `expeditions.title + description` via Postgres trigram/tsvector.
