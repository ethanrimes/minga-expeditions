-- ============================================================================
-- WhatsApp phone number verification (DIY OTP via Meta Cloud API).
--
-- Flow: when a user adds a phone in their profile we generate a 6-digit code,
-- store the SHA-256 hash here, and ship the code via Meta's free Authentication-
-- category WhatsApp template. The user types the code back, we hash + compare,
-- and on success stamp profiles.phone_verified_at.
--
-- Rows are short-lived (10-minute expiry, 5-attempt cap, deleted on success).
-- Service-role only — clients never touch this table directly, so the RLS
-- default-deny posture is intentional.
-- ============================================================================

create table if not exists public.phone_verifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  phone_e164 text not null,
  code_hash text not null,
  expires_at timestamptz not null,
  attempts smallint not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists phone_verifications_user_phone_idx
  on public.phone_verifications (user_id, phone_e164, created_at desc);

alter table public.phone_verifications enable row level security;
-- No policies — only service_role (Edge Functions) reads/writes.

alter table public.profiles
  add column if not exists phone_verified_at timestamptz;
