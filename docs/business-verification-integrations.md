# Business Verification Runbook for Production Integrations

Last updated: 2026-06-07

This guide covers the third-party accounts that Minga Expeditions needs to verify or activate before a production launch. It is written for the business owner who now has the Colombian business documents, especially the **RUT** and **Camara de Comercio**.

The app currently uses:

| Integration | What the app uses it for | Business verification needed? | Production blocker if skipped |
|---|---|---:|---|
| Meta Business / WhatsApp Cloud API | WhatsApp OTP and booking confirmations | Yes | WhatsApp templates and messaging limits stay blocked or restricted |
| Meta Facebook Login | Facebook OAuth through Supabase Auth | Usually yes for public launch | App can remain in development mode, so only test users can sign in |
| Google OAuth | Google sign-in through Supabase Auth | App verification/domain verification may be needed | External users may see an unverified app warning or be blocked if scopes change |
| Wompi | Colombian payment processing for expedition bookings | Yes, merchant activation | Cannot use live payment keys or receive payouts |
| Resend / transactional email | Booking confirmation emails | Domain verification, not business KYC | Emails stay on dev sender or fail deliverability checks |
| Apple Developer / App Store Connect | iOS app publishing | Yes for organization account | Cannot publish under the business name |
| Google Play Console | Android app publishing | Yes for organization account | Cannot publish under the business name |
| Supabase | Database, auth, storage, edge functions | No formal business KYC for app launch | Still must own the production project and configure OAuth providers |
| Sentry | Mobile crash/error monitoring | No formal business KYC | Optional; create business-owned project before launch |
| Vercel / hosting / DNS | Web, admin, mobile-web hosting | Domain ownership verification | Production callbacks and sender domains cannot be finalized |
| MapLibre / Photon | Maps and geocoding | No | No business verification needed |

## 0. Prepare the single business identity packet first

Do this before opening any provider dashboard. Every provider rejects or delays verification when legal names, addresses, NITs, phone numbers, or domains do not match.

### Documents to keep ready

1. **RUT** from DIAN.
2. **Camara de Comercio / Certificado de existencia y representacion legal**, preferably issued within the last 90 days.
3. **Legal representative ID** (cedula or passport), front and back if applicable.
4. **Business bank certificate or bank account proof** showing account holder and account number, especially for Wompi payouts.
5. **Business phone number** controlled by the owner or representative.
6. **Business domain and website**, ideally with:
   - legal business name in the footer or contact page,
   - NIT or business registration details if acceptable for the brand,
   - contact email using the domain,
   - privacy policy, terms, and data deletion pages.
7. **Business email inbox** on the domain, for example `admin@minga.co`, `legal@minga.co`, or `hello@minga.co`.

### Canonical values to copy exactly

Create one internal note and copy/paste these values into every provider:

| Field | Use exactly what appears on |
|---|---|
| Legal business name / razon social | RUT and Camara de Comercio |
| NIT | RUT |
| Registered address | RUT or Camara de Comercio; choose one and use it everywhere |
| Legal representative | Camara de Comercio |
| Business category | Travel, tourism, outdoor activities, or closest provider option |
| Business website | Production web domain |
| Support email | Domain email |
| Support phone | Reachable business phone |

## 1. Meta Business verification

This unlocks WhatsApp production use and helps move Facebook Login out of dev/test mode.

### 1.1 Create or clean up the Meta Business portfolio

1. Go to [Meta Business Suite](https://business.facebook.com/).
2. Confirm the owner is an **admin** of the business portfolio.
3. Turn on two-factor authentication for all admins.
4. In **Business Settings -> Business Info**, set:
   - legal business name,
   - NIT/tax ID if prompted,
   - address,
   - website,
   - business phone,
   - business email.
5. Make sure these values match the RUT/Camara packet exactly.

### 1.2 Submit Meta Business Verification

1. Go to **Business Settings -> Security Center**.
2. Click **Start Verification** or **Business Verification**.
3. Enter the business details from the canonical packet.
4. Upload the **RUT** first if Meta accepts it for the requested proof.
5. If Meta asks for legal registration or additional proof, upload **Camara de Comercio**.
6. If Meta asks for phone/address proof, use a bank statement, utility bill, or other accepted document that matches the business name/address.
7. Choose email or phone confirmation and complete the code challenge.
8. Submit and wait for review. Plan for several business days and possible re-upload if any field does not match.

### 1.3 Set up WhatsApp Cloud API after or during verification

The app uses these functions:

- `supabase/functions/whatsapp-send`
- `supabase/functions/whatsapp-otp-send`
- `supabase/functions/whatsapp-otp-verify`
- `supabase/functions/wompi-webhook` calls WhatsApp when `WHATSAPP_ENABLED=true`

Steps:

1. In [Meta for Developers](https://developers.facebook.com/), create or open the business-owned app for WhatsApp.
2. Add the **WhatsApp** product.
3. In **WhatsApp -> API Setup**, record:
   - WhatsApp Business Account ID -> `WHATSAPP_BUSINESS_ACCOUNT_ID`
   - Phone Number ID -> `WHATSAPP_PHONE_ID`
4. Add or migrate the production sender phone number.
5. Complete phone-number verification if Meta prompts for SMS or voice.
6. Create a System User in **Business Settings -> Users -> System Users**.
7. Assign the WhatsApp Business Account asset to that system user.
8. Generate a permanent token with WhatsApp messaging permissions.
9. Store it as `WHATSAPP_TOKEN` in Supabase Edge Function secrets.
10. Create and submit these message templates:
    - `verification_code` in `es_CO` for WhatsApp OTP.
    - `order_confirmation` in `es_CO` for paid booking confirmations.
11. Wait until templates show **Approved**.
12. Set Supabase secrets:

    ```powershell
    supabase secrets set `
      WHATSAPP_ENABLED=true `
      WHATSAPP_TOKEN=<permanent-system-user-token> `
      WHATSAPP_PHONE_ID=<phone-number-id> `
      WHATSAPP_BUSINESS_ACCOUNT_ID=<waba-id>
    ```

13. Redeploy:

    ```powershell
    supabase functions deploy whatsapp-send
    supabase functions deploy whatsapp-otp-send
    supabase functions deploy whatsapp-otp-verify
    supabase functions deploy wompi-webhook
    ```

14. Test:
    - add a WhatsApp number in profile,
    - request OTP,
    - complete a Wompi sandbox or production test purchase,
    - confirm the booking message arrives.

### 1.4 Move Facebook Login to production

The app uses Facebook Login through Supabase Auth in:

- `apps/web/src/pages/AuthPage.tsx`
- `apps/mobile/App.tsx`
- `apps/mobile-web/src/App.tsx`
- `packages/ui/src/screens/AuthScreen.tsx`

Steps:

1. Use a separate Meta app for consumer Facebook Login if needed. The repo already documents two Meta apps: one for WhatsApp/business APIs and one for classic Facebook Login.
2. Add the **Facebook Login** product.
3. In Facebook Login settings, add the Supabase callback URL:

   ```text
   https://<supabase-project-ref>.supabase.co/auth/v1/callback
   ```

4. Add production app domains, privacy policy URL, terms URL, and data deletion URL.
5. Keep permissions minimal: `public_profile` and `email`.
6. Add test users and test login.
7. If Meta requires App Review or business verification before Live mode, submit after Business Verification is approved.
8. Switch the app to **Live**.
9. In Supabase dashboard -> **Authentication -> Providers -> Facebook**, paste:
   - `META_AUTH_APP_ID`
   - `META_AUTH_APP_SECRET`
10. Test with a Facebook account that is not listed as a developer/tester.

## 2. Google OAuth verification

The app uses Google sign-in through Supabase Auth. Current app usage is basic profile/email OAuth, so the goal is to publish a trustworthy external OAuth consent screen and avoid unverified-app warnings.

### 2.1 Create a business-owned Google Cloud project

1. Go to [Google Cloud Console](https://console.cloud.google.com/).
2. Create a project under the business Google account or organization.
3. Record:
   - `GOOGLE_CLOUD_PROJECT_ID`
   - `GOOGLE_CLOUD_PROJECT_NUMBER`
4. Configure billing only if Google requires it for the project or APIs you later add.

### 2.2 Verify the domain

1. Go to [Google Search Console](https://search.google.com/search-console).
2. Add the production domain as a domain property.
3. Add the DNS TXT record at the DNS provider.
4. Wait for verification.

### 2.3 Configure OAuth consent screen

1. In Google Cloud -> **APIs & Services -> OAuth consent screen**.
2. Choose **External**.
3. Fill in:
   - app name: `Minga Expeditions`,
   - user support email,
   - app logo,
   - homepage URL,
   - privacy policy URL,
   - terms URL,
   - authorized domain.
4. Add only required scopes:
   - `openid`
   - `email`
   - `profile`
5. Add test users while in testing mode.
6. Publish the app when ready.
7. If Google prompts for verification, submit:
   - explanation that Google data is only used for account login,
   - privacy policy,
   - demo video if requested,
   - business document if Google asks for organization proof.

### 2.4 Create the OAuth client and wire Supabase

1. Go to **APIs & Services -> Credentials -> Create Credentials -> OAuth client ID**.
2. Choose **Web application**.
3. Add authorized redirect URI:

   ```text
   https://<supabase-project-ref>.supabase.co/auth/v1/callback
   ```

4. Save the Client ID and Client Secret.
5. In Supabase dashboard -> **Authentication -> Providers -> Google**, paste:
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
6. Test Google login on web and mobile.

## 3. Wompi merchant activation

The app uses Wompi for paid expedition checkout:

- `supabase/functions/wompi-create-order`
- `supabase/functions/wompi-webhook`
- `supabase/functions/wompi-order-status`
- web/mobile checkout via Wompi hosted checkout/widget

### 3.1 Create or update the merchant account

1. Go to [Wompi Comercios](https://comercios.wompi.co/).
2. Register or sign in using the business-owned email.
3. Choose the correct entity type:
   - persona juridica if the business is a company,
   - persona natural only if the owner will operate as an individual merchant.
4. Enter the legal name and NIT exactly from the RUT.
5. Upload requested documents. For a Colombian company, expect:
   - RUT,
   - Camara de Comercio, usually current and legible,
   - legal representative ID,
   - business bank account certificate/proof tied to the NIT,
   - any Wompi onboarding forms.
6. Complete bank/payout information.
7. Wait for account activation and production access.

### 3.2 Switch from sandbox to production

1. In Wompi dashboard, switch from **Sandbox** to **Production**.
2. Go to **Desarrolladores -> Llaves de API**.
3. Copy production values:
   - public key -> `WOMPI_PUBLIC_KEY`
   - integrity key -> `WOMPI_INTEGRITY_KEY`
   - events secret -> `WOMPI_EVENTS_SECRET`
4. Set Supabase Edge Function secrets:

   ```powershell
   supabase secrets set `
     WOMPI_PUBLIC_KEY=<prod-public-key> `
     WOMPI_INTEGRITY_KEY=<prod-integrity-key> `
     WOMPI_EVENTS_SECRET=<prod-events-secret> `
     PUBLIC_SITE_URL=https://<production-web-domain>
   ```

5. Redeploy:

   ```powershell
   supabase functions deploy wompi-create-order
   supabase functions deploy wompi-webhook
   supabase functions deploy wompi-order-status
   ```

6. In Wompi **Eventos**, set webhook URL:

   ```text
   https://<supabase-project-ref>.supabase.co/functions/v1/wompi-webhook
   ```

7. Subscribe to at least `transaction.updated`.
8. Make a small real transaction and confirm:
   - order becomes `approved`,
   - Wompi dashboard shows payment,
   - email confirmation sends,
   - WhatsApp confirmation sends if enabled,
   - payout/bank information is valid.

## 4. Resend and email sender verification

The app sends booking confirmations through:

- `supabase/functions/email-send`
- `supabase/functions/wompi-webhook`

Current env vars:

- `RESEND_API_KEY`
- `EMAIL_FROM`

Steps:

1. Create a Resend account owned by the business.
2. Add the production domain, for example `minga.co`.
3. In DNS, add the records Resend provides for domain verification and DKIM.
4. Add or confirm SPF. If Resend uses Amazon SES for your account, this often includes an SPF value similar to:

   ```text
   v=spf1 include:amazonses.com ~all
   ```

   Do not overwrite an existing SPF record; merge includes into one SPF TXT record.

5. Add DMARC at `_dmarc.<domain>`. Start with monitoring:

   ```text
   v=DMARC1; p=none; rua=mailto:postmaster@<domain>
   ```

6. Wait for DNS propagation.
7. In Resend, verify the domain.
8. Create an API key.
9. Set Supabase secrets:

   ```powershell
   supabase secrets set `
     RESEND_API_KEY=<resend-api-key> `
     EMAIL_FROM="Minga Expeditions <noreply@<domain>>"
   ```

10. Redeploy:

    ```powershell
    supabase functions deploy email-send
    supabase functions deploy wompi-webhook
    ```

11. Test a booking and confirm the email passes SPF/DKIM/DMARC in the received message headers.

## 5. Apple Developer Program and App Store Connect

The native app config is in `apps/mobile/app.json`:

- iOS bundle identifier: `co.minga.expeditions`
- Expo EAS project: `extra.eas.projectId`

### 5.1 Enroll as an organization

1. Create or choose an Apple ID controlled by the business owner.
2. Enable two-factor authentication.
3. Confirm the business has a D-U-N-S Number. If not, request one through Apple's D-U-N-S lookup/enrollment flow.
4. Make sure Dun & Bradstreet data matches the RUT/Camara packet:
   - legal name,
   - address,
   - phone,
   - legal entity status.
5. Enroll at [Apple Developer Program](https://developer.apple.com/programs/enroll/) as an **Organization**, not Individual.
6. Apple may call or email the business contact to verify authority.
7. Pay the annual Apple Developer Program fee.
8. After approval, create or access App Store Connect.

### 5.2 Prepare App Store Connect business/compliance items

1. In App Store Connect, complete:
   - Agreements,
   - Tax,
   - Banking, if paid app features or payouts require it.
2. Create the app record with bundle ID `co.minga.expeditions`.
3. Add privacy policy and support URLs.
4. Complete App Privacy answers based on actual app behavior:
   - account data,
   - location tracking,
   - photos,
   - purchases/bookings,
   - crash diagnostics via Sentry if enabled.
5. Because the app offers Google/Facebook login plus email login, check Apple Guideline 4.8 before submission. If Apple requires it, add **Sign in with Apple** or remove third-party social login from the iOS build until implemented.
6. Build with production env:

   ```powershell
   eas build -p ios --profile production
   ```

7. Submit via EAS Submit or Transporter.

## 6. Google Play Console

The native app config is in `apps/mobile/app.json`:

- Android package: `co.minga.expeditions`

### 6.1 Create and verify the developer account

1. Create a Google Play Console account owned by the business.
2. Choose **Organization** account if the app should publish under the business name.
3. Create or link the Google Payments profile with matching business details.
4. Complete developer verification in Play Console:
   - legal business name,
   - registered address,
   - phone,
   - website,
   - support email,
   - D-U-N-S Number if Google requests it,
   - RUT/Camara or equivalent official business document if requested,
   - personal ID for the authorized representative if requested.
5. Complete phone and email verification.
6. Wait for account approval.

### 6.2 Prepare Play app release

1. Create the app in Play Console using package `co.minga.expeditions`.
2. Complete **App content**:
   - Privacy Policy URL,
   - Data Safety,
   - Ads declaration,
   - App access instructions,
   - Target audience,
   - Permissions declaration for location/background location if requested.
3. Confirm Wompi usage complies with Google Play billing rules. This app sells real-world expedition/travel services, so external payment processing is usually allowed; do not use Wompi for digital goods consumed inside the app.
4. Build Android:

   ```powershell
   eas build -p android --profile production
   ```

5. Upload to internal testing first.
6. Test Google login, Facebook login, location tracking, checkout redirect, WhatsApp OTP, and account deletion.
7. Promote to closed/open testing or production after review.

## 7. Supabase production project

Supabase does not require business-document verification for this app, but the project must be owned by the business or a business-controlled organization.

Steps:

1. Create a new Supabase project under the business account.
2. Run migrations:

   ```powershell
   supabase link --project-ref <production-ref>
   supabase db push
   ```

3. Configure Auth providers:
   - Google Client ID/Secret,
   - Facebook App ID/Secret.
4. Add callback URLs in Google/Meta:

   ```text
   https://<production-ref>.supabase.co/auth/v1/callback
   ```

5. Set Edge Function secrets for Wompi, WhatsApp, Resend, and `PUBLIC_SITE_URL`.
6. Deploy all production functions:

   ```powershell
   supabase functions deploy wompi-create-order
   supabase functions deploy wompi-webhook
   supabase functions deploy wompi-order-status
   supabase functions deploy whatsapp-send
   supabase functions deploy whatsapp-otp-send
   supabase functions deploy whatsapp-otp-verify
   supabase functions deploy email-send
   supabase functions deploy activity-share-card
   ```

7. Create the first admin profile and promote it:

   ```sql
   update public.profiles
      set role = 'admin'
    where username = '<owner-or-admin-username>';
   ```

## 8. Sentry

Sentry does not require Colombian business verification for launch, but the production DSN should belong to the business.

Steps:

1. Create a Sentry organization and React Native project under the business account.
2. Copy the DSN.
3. Set `EXPO_PUBLIC_SENTRY_DSN` for production mobile builds.
4. Confirm `apps/mobile/App.tsx` reads the DSN from env.
5. Trigger a test error in a non-production build and confirm it lands in Sentry.

## 9. Hosting, DNS, and production URLs

This is not business KYC, but every verification flow depends on stable URLs.

Steps:

1. Choose production domains:
   - web app, for example `https://minga.co`
   - admin, for example `https://admin.minga.co`
   - mobile-web if used
2. Add domains to the hosting provider.
3. Add DNS records at the domain registrar.
4. Verify domain ownership in:
   - hosting provider,
   - Google Search Console,
   - Resend,
   - Meta app domains if prompted.
5. Update:
   - `PUBLIC_SITE_URL`
   - app OAuth redirect origins
   - privacy policy URL
   - terms URL
   - data deletion URL
   - Wompi redirect URL behavior

## 10. Recommended completion order

1. Normalize business identity packet.
2. Verify/prepare production domain and business email.
3. Start Apple D-U-N-S / Apple Developer enrollment, because it can take the longest.
4. Start Meta Business Verification.
5. Start Wompi merchant production activation.
6. Create Supabase production project.
7. Configure Google OAuth and domain verification.
8. Configure Resend domain authentication.
9. Finish WhatsApp templates once Meta allows template creation.
10. Switch Wompi to production keys and webhook.
11. Build and submit iOS/Android apps.
12. Run the launch test plan in `docs/LAUNCH.md`.

## 11. Final production readiness checklist

- [ ] RUT and Camara values match every provider profile.
- [ ] Meta Business Verification approved.
- [ ] WhatsApp phone number verified.
- [ ] WhatsApp templates `verification_code` and `order_confirmation` approved.
- [ ] Facebook Login app is Live and works for non-test users.
- [ ] Google OAuth consent screen is published and works for non-test users.
- [ ] Wompi production merchant account active.
- [ ] Wompi production webhook points to production Supabase function.
- [ ] Resend domain verified with SPF, DKIM, and DMARC.
- [ ] Apple Developer organization enrollment approved.
- [ ] App Store Connect agreements/tax/banking completed.
- [ ] Google Play organization developer verification approved.
- [ ] Play Console Data Safety and app content forms completed.
- [ ] Supabase production project owns all Auth provider credentials and Edge Function secrets.
- [ ] Production web/admin/mobile builds use business-owned credentials only.
- [ ] A real low-value booking has been tested end to end.

## References

- Existing integration inventory: `docs/integrations.md`
- Production handover checklist: `docs/HANDOVER.md`
- Launch test runbook: `docs/LAUNCH.md`
- Meta business verification checklist: `docs/meta-business-verification.md`
- Meta for Developers: <https://developers.facebook.com/>
- Meta Business Suite: <https://business.facebook.com/>
- Google Cloud Console: <https://console.cloud.google.com/>
- Google Search Console: <https://search.google.com/search-console>
- Wompi merchant dashboard: <https://comercios.wompi.co/>
- Resend domain authentication: <https://resend.com/docs/dashboard/domains/introduction>
- Apple Developer enrollment: <https://developer.apple.com/programs/enroll/>
- Apple D-U-N-S lookup: <https://developer.apple.com/enroll/duns-lookup/>
- Google Play Console: <https://play.google.com/console/>
