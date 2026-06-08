# Minga on Azure — self-hosted Supabase runbook

This directory stands up an **Azure backend that is API-compatible with Supabase**
so the four frontends (`apps/web`, `apps/mobile-web`, `apps/admin`, `apps/mobile`)
and the Deno edge functions keep working with **only a URL + key swap**. Supabase
stays fully intact as the rollback target — nothing here touches it.

```
supabase-js / @supabase/ssr  ──►  Kong (one origin)
                                    ├─ /auth/v1   → GoTrue
                                    ├─ /rest/v1   → PostgREST   ┐
                                    ├─ /storage/v1→ Storage API │ all hit the same
                                    ├─ /realtime/v1→ Realtime   │ Postgres Flexible
                                    └─ /functions/v1→ edge fns  ┘ Server (RLS intact)
```

A backend swap is a config change only — see [`scripts/select-backend.mjs`](../../scripts/select-backend.mjs)
and the root `.env` `MINGA_BACKEND` selector. The Postgres schema, RLS, roles,
storage-bucket metadata and `auth.*` helpers are byte-for-byte the Supabase ones
(applied from [`sql/00_supabase_bootstrap.sql`](sql/00_supabase_bootstrap.sql) +
`supabase/migrations/*` + [`sql/99_grants.sql`](sql/99_grants.sql)).

---

## 1. What is provisioned

`deploy.ps1` / `deploy.sh` create (idempotently):

| Resource | Dev value (AIERP) | Notes |
| --- | --- | --- |
| Resource group | `rg-minga-dev-eastus` | RG in `eastus`; **resources** in `westus2` (see policy notes) |
| Postgres Flexible Server | `minga-pg-dev-1db10c` | PG16, `Standard_B2s` Burstable, SSL required |
| Database | `minga` | bootstrap + 24 migrations + grants applied |
| Storage account | `mingadevst1db10c` | StorageV2, **Entra-only** (shared key disabled), public blob **off** |
| Blob containers | `activity-photos`, `avatars`, `expedition-photos` | mirror the 3 Supabase buckets |
| Key Vault | `minga-kv-1db10c` | RBAC-auth; holds DB + JWT secrets |

Key Vault secrets: `pg-admin-user`, `pg-admin-password`, `pg-host`, `database-url`,
`jwt-secret`, `anon-key`, `service-role-key`.

### Reproduce / deploy to another subscription

```powershell
# Dev (AIERP), reuse existing names — safe to re-run:
./infra/azure/deploy.ps1

# Production on a clean subscription + region (East US ≈ 71 ms to Bogotá):
./infra/azure/deploy.ps1 -SubscriptionId <prod-sub> -Location eastus `
    -ResourceGroup rg-minga-prod -NameSuffix prod01
```

```bash
./infra/azure/deploy.sh --subscription-id <prod-sub> --location eastus \
    --resource-group rg-minga-prod --name-suffix prod01
```

---

## 2. AIERP policy constraints (why the defaults look odd)

The dev subscription (`5423a68c-...`) is governed by corporate Azure Policy:

- **Postgres region restriction** — create is denied in `eastus`, `eastus2`,
  `centralus`, `southcentralus` ("The location is restricted from performing this
  operation"). Only **`westus2`** is accepted. (Resource-group creation in `eastus`
  is fine — the RG-location policy differs from the resource-location policy.)
- **Storage local-auth disabled** — `allowSharedKeyAccess` must be `false`
  (policy `SafeSec-Strg-OptIn`). Access is Entra-ID/RBAC only; **public blob access
  is also off**. Public read of media is therefore served via **Azure CDN / Front
  Door with SAS or a managed-identity origin**, not anonymous blob URLs.

A clean production subscription usually lifts both — pass `-Location eastus` and the
production storage account can re-enable public/anonymous read if your prod policy
allows it.

---

## 3. Service layer (Container Apps) — wiring the Supabase-compatible API

The Postgres + schema are live. To serve the Supabase REST/auth/storage/realtime
endpoints, run the standard Supabase images on **Azure Container Apps** (one
environment, internal ingress, Kong as the only public origin). Pull every secret
from Key Vault via a user-assigned managed identity.

### 3a. `authenticator` LOGIN role (one-time, do before PostgREST/GoTrue)

The bootstrap created `anon` / `authenticated` / `service_role` as `NOLOGIN`.
PostgREST and GoTrue connect as a LOGIN role that can `SET ROLE` into them:

```sql
-- run as mingaadmin against the minga DB (psql or scripts/run-sql.mjs):
create role authenticator login password '<KV: authenticator-password>' noinherit;
grant anon, authenticated, service_role to authenticator;
```

Store that password as a new Key Vault secret `authenticator-password` first.

### 3b. Image → env mapping (all secrets from Key Vault)

| Service | Image | Critical env |
| --- | --- | --- |
| **Kong** | `kong:2.8` | declarative config routing `/auth/v1`,`/rest/v1`,`/storage/v1`,`/realtime/v1`,`/functions/v1`; injects `apikey` → anon/service |
| **GoTrue** (auth) | `supabase/gotrue` | `GOTRUE_DB_DATABASE_URL=postgres://authenticator:…@<pg-host>/minga?sslmode=require`, `GOTRUE_JWT_SECRET=<KV jwt-secret>`, `GOTRUE_SITE_URL`, `GOTRUE_URI_ALLOW_LIST` (see §4), `GOTRUE_JWT_EXP=3600`, `GOTRUE_EXTERNAL_GOOGLE_*`, `GOTRUE_EXTERNAL_FACEBOOK_*` |
| **PostgREST** | `postgrest/postgrest` | `PGRST_DB_URI=postgres://authenticator:…/minga`, `PGRST_DB_SCHEMAS=public,storage`, `PGRST_DB_ANON_ROLE=anon`, `PGRST_JWT_SECRET=<KV jwt-secret>`, `PGRST_DB_EXTRA_SEARCH_PATH=public,extensions` |
| **Storage API** | `supabase/storage-api` | `DATABASE_URL=…/minga`, `PGRST_JWT_SECRET=<KV jwt-secret>`, `ANON_KEY`/`SERVICE_KEY` from KV, `STORAGE_BACKEND` (see storage note) |
| **Realtime** | `supabase/realtime` | `DB_*` to the Flexible Server, `API_JWT_SECRET=<KV jwt-secret>`, `APP_NAME=realtime` |

The `jwt-secret`, `anon-key` and `service-role-key` already in Key Vault are a
matched set (anon/service are HS256-signed with the stored secret by
[`scripts/gen-jwt-keys.mjs`](../../scripts/gen-jwt-keys.mjs)), so they validate
across GoTrue/PostgREST/Storage/Kong with no extra steps.

### 3c. Storage backend note

`supabase/storage-api` speaks S3/file, not Azure Blob natively. Two options:
1. **Recommended for parity:** run storage-api with a small S3-compatible shim or
   its `file` backend on a mounted Azure Files share, and front media reads with
   **Azure CDN** (the buckets/containers here are the durable store + CDN origin).
2. **App-native:** bypass storage-api and have the apps read/write the Blob
   containers directly via SAS/managed identity. This diverges from `supabase-js`'s
   `storage.from(...)` API, so prefer option 1 while keeping Supabase swappable.

---

## 4. Auth parity (`supabase/config.toml`)

Reproduce these GoTrue settings exactly:

- `site_url = https://minga-expeditions-web.vercel.app`
- `jwt_expiry = 3600`, `enable_signup = true`, email confirmations **off**
  (`enable_confirmations = false`)
- **Providers in use:** email/password, **Google**, **Facebook**
  (`apps/*/…signInWithOAuth({ provider: 'google' | 'facebook' })`). Configure
  `GOTRUE_EXTERNAL_GOOGLE_*` / `GOTRUE_EXTERNAL_FACEBOOK_*` and add the Azure
  callback to each provider console.
- `GOTRUE_URI_ALLOW_LIST` must include every `additional_redirect_urls` entry:
  `http://localhost:5173/**`, `http://localhost:5174/**`, `exp://localhost:8081`,
  `minga://auth/callback`, `https://minga-expeditions-web.vercel.app/**`,
  `https://minga-expeditions-mobile-web.vercel.app/**`.

---

## 5. Edge functions (9)

Run these Deno functions either (a) unchanged on Supabase (they're provider-neutral
HTTP) or (b) as a Deno container behind Kong's `/functions/v1`. Three are public
(`verify_jwt = false`): **`geo-tile`**, **`wompi-order-status`**, **`wompi-create-order`**.

| Function | Public? | Secrets it needs |
| --- | --- | --- |
| `geo-tile` | yes | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` |
| `activity-share-card` | no | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` |
| `email-send` | no | `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `EMAIL_FROM` |
| `whatsapp-send` | no | `SUPABASE_SERVICE_ROLE_KEY`, `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_ID` |
| `whatsapp-otp-send` | no | + `WHATSAPP_OTP_TEMPLATE`, `WHATSAPP_OTP_LANG` |
| `whatsapp-otp-verify` | no | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` |
| `wompi-create-order` | yes | `WOMPI_PUBLIC_KEY`, `WOMPI_INTEGRITY_KEY`, `PUBLIC_SITE_URL`, `ALLOWED_RETURN_ORIGINS` |
| `wompi-order-status` | yes | `WOMPI_API_BASE` (+ service role) |
| `wompi-webhook` | no | `WOMPI_EVENTS_SECRET`, `WHATSAPP_ENABLED` |

For the Azure backend, set each function's `SUPABASE_URL` to the **Kong origin** and
`SUPABASE_SERVICE_ROLE_KEY` to the Key Vault `service-role-key`. The third-party
secrets (Resend, WhatsApp/Meta, Wompi) are the same values you use on Supabase —
store them in Key Vault and inject them.

---

## 6. Cutover

1. Stand up §3 services; note the Kong public URL (e.g. `https://minga-api.<region>.azurecontainerapps.io`).
2. In root `.env`, fill the **`BACKEND_AZURE_*`** source block:
   ```
   BACKEND_AZURE_SUPABASE_URL=<Kong origin>
   BACKEND_AZURE_SUPABASE_ANON_KEY=<KV anon-key>
   BACKEND_AZURE_SUPABASE_SERVICE_ROLE_KEY=<KV service-role-key>
   BACKEND_AZURE_SUPABASE_DB_URL=<KV database-url>
   ```
3. Activate: `npm run backend:azure` (rewrites active `SUPABASE_*` + the
   `VITE_/EXPO_PUBLIC_/NEXT_PUBLIC_` mirrors and per-app env files).
4. `npm run backend:status` to confirm the active URL is the Kong origin.
5. Redeploy the apps with the regenerated env.

## 7. Rollback (Supabase stays the source of truth until you decide otherwise)

```
npm run backend:supabase   # flips every app back to https://dgkmvoteliomghoctwrd.supabase.co
```
Nothing in Supabase was modified by this migration, so rollback is instant and total.

## 8. Production subscription swap

The dev work lives on AIERP. For prod, run `deploy.ps1 -SubscriptionId <prod>` (app
side already swappable via the selector). The only AIERP-specific concessions are the
`westus2` region pin and the storage local-auth/public-blob policy — both overridable
on a less-restricted subscription (prefer `eastus` for ~71 ms Bogotá latency vs.
`westus2`/Supabase-Oregon ~136 ms).
