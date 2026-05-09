-- ============================================================================
-- Phase 2 · Vendor proposals
-- ----------------------------------------------------------------------------
-- Vendors fill out an unauthenticated form on the marketing site or in the
-- mobile app. Proposals land here for an admin to triage. The submitter has
-- no account at submit-time — Phase 4 introduces real vendor sign-in, at
-- which point a `submitter_profile_id` can be linked back to existing rows.
-- ============================================================================

do $$ begin
  if not exists (select 1 from pg_type where typname = 'vendor_type') then
    create type public.vendor_type as enum
      ('full_experience','transportation','lodging','guide','food','other');
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_type where typname = 'proposal_status') then
    create type public.proposal_status as enum
      ('new','reviewing','accepted','rejected','archived');
  end if;
end $$;

create table if not exists public.vendor_proposals (
  id uuid primary key default gen_random_uuid(),

  -- Vendor-supplied fields
  vendor_name text not null check (length(vendor_name) between 2 and 200),
  contact_email text,
  contact_phone text,
  vendor_type public.vendor_type not null,
  region text,
  title text not null check (length(title) between 3 and 200),
  description text not null check (length(description) between 10 and 8000),
  pricing_notes text,
  attachments_url text,

  -- Admin-managed fields
  status public.proposal_status not null default 'new',
  admin_notes text,
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,

  -- Phase 4 link to a real vendor account (nullable for now).
  submitter_profile_id uuid references public.profiles(id) on delete set null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Require at least one contact method.
  constraint vendor_proposals_contact_required
    check (contact_email is not null or contact_phone is not null)
);

create index if not exists vendor_proposals_status_idx
  on public.vendor_proposals (status, created_at desc);
create index if not exists vendor_proposals_type_idx
  on public.vendor_proposals (vendor_type);

create trigger vendor_proposals_touch
  before update on public.vendor_proposals
  for each row execute function public.touch_updated_at();

-- ---------- RLS -----------------------------------------------------------
alter table public.vendor_proposals enable row level security;

-- Anyone (anon or authenticated) may submit. We deliberately allow anon
-- inserts so the form on the marketing site does not require sign-up.
drop policy if exists "anyone may submit a proposal" on public.vendor_proposals;
create policy "anyone may submit a proposal"
  on public.vendor_proposals for insert
  to anon, authenticated
  with check (true);

-- Admins see everything.
drop policy if exists "admins read all proposals" on public.vendor_proposals;
create policy "admins read all proposals"
  on public.vendor_proposals for select
  using (public.is_admin());

drop policy if exists "admins update proposals" on public.vendor_proposals;
create policy "admins update proposals"
  on public.vendor_proposals for update
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "admins delete proposals" on public.vendor_proposals;
create policy "admins delete proposals"
  on public.vendor_proposals for delete
  using (public.is_admin());

-- Phase 4 hook: vendors will read their own rows. Stub the policy now so
-- when the role exists, no further DDL is needed.
drop policy if exists "vendors read own proposals" on public.vendor_proposals;
create policy "vendors read own proposals"
  on public.vendor_proposals for select
  using (submitter_profile_id is not null and submitter_profile_id = auth.uid());

-- ---------- reviewed_by / reviewed_at auto-stamp --------------------------
create or replace function public.vendor_proposals_review_stamp()
returns trigger language plpgsql as $$
begin
  if tg_op = 'UPDATE' and new.status is distinct from old.status then
    new.reviewed_at := now();
    new.reviewed_by := auth.uid();
  end if;
  return new;
end;
$$;

drop trigger if exists vendor_proposals_review_stamp on public.vendor_proposals;
create trigger vendor_proposals_review_stamp
  before update on public.vendor_proposals
  for each row execute function public.vendor_proposals_review_stamp();
