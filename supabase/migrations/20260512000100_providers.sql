-- ============================================================================
-- Admin restructure · Phase 1 · Providers directory
-- ----------------------------------------------------------------------------
-- The admin's "Providers > Directory" page needs a first-class row per
-- merchant/operator. `vendor_proposals` are pre-account submissions
-- (potentially with no profile, no admin curation); `profiles.role='vendor'`
-- only exists for providers who have signed up. Neither is suitable as the
-- rolodex source of truth.
--
-- A `providers` row is the durable directory record. It can stand alone
-- (admin types in a provider before they have an account) and optionally
-- link to a profile (after sign-up) and/or back to the vendor_proposal it
-- originated from.
--
-- Salidas reference a provider via `expedition_salidas.provider_id`
-- ("who specifically is organizing the salida"). Expeditions hold a
-- `default_provider_id` so a template can suggest its usual operator while
-- letting individual salidas override.
-- ============================================================================

create table if not exists public.providers (
  id uuid primary key default gen_random_uuid(),

  -- Linkage to other identity records (both optional).
  profile_id uuid references public.profiles(id) on delete set null,
  proposal_id uuid references public.vendor_proposals(id) on delete set null,

  -- Directory fields shown in the admin rolodex.
  display_name text not null check (length(display_name) between 2 and 200),
  vendor_type public.vendor_type,
  region text,
  contact_email text,
  contact_phone text,
  whatsapp text,
  website text,
  notes text,

  is_active boolean not null default true,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- A profile can only back a single provider (one operator account = one row).
create unique index if not exists providers_profile_uniq
  on public.providers (profile_id) where profile_id is not null;

-- One provider per source proposal — when an admin accepts a proposal it
-- promotes into exactly one directory entry.
create unique index if not exists providers_proposal_uniq
  on public.providers (proposal_id) where proposal_id is not null;

create index if not exists providers_active_name_idx
  on public.providers (is_active, lower(display_name));
create index if not exists providers_vendor_type_idx
  on public.providers (vendor_type);
create index if not exists providers_region_idx
  on public.providers (region);

create trigger providers_touch
  before update on public.providers
  for each row execute function public.touch_updated_at();

-- ---------- RLS ------------------------------------------------------------
alter table public.providers enable row level security;

-- Public read of active providers — mobile UI shows "operated by X" badges.
drop policy if exists "active providers public read" on public.providers;
create policy "active providers public read"
  on public.providers for select
  using (is_active = true);

-- A provider with a linked profile can always read their own row.
drop policy if exists "providers read own" on public.providers;
create policy "providers read own"
  on public.providers for select
  using (profile_id is not null and profile_id = auth.uid());

drop policy if exists "admins manage providers" on public.providers;
create policy "admins manage providers"
  on public.providers for all
  using (public.is_admin()) with check (public.is_admin());

-- ---------- FKs from salidas / expeditions / proposals ---------------------
alter table public.expedition_salidas
  add column if not exists provider_id uuid references public.providers(id) on delete set null;

create index if not exists salidas_provider_idx
  on public.expedition_salidas (provider_id) where provider_id is not null;

alter table public.expeditions
  add column if not exists default_provider_id uuid references public.providers(id) on delete set null;

create index if not exists expeditions_default_provider_idx
  on public.expeditions (default_provider_id) where default_provider_id is not null;

-- Reverse link so admin UI can answer "did this proposal already get promoted?"
alter table public.vendor_proposals
  add column if not exists provider_id uuid references public.providers(id) on delete set null;

create index if not exists vendor_proposals_provider_idx
  on public.vendor_proposals (provider_id) where provider_id is not null;
