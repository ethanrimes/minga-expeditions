-- ============================================================================
-- Phase 3 · Orders, guest contacts, and account claim
-- ----------------------------------------------------------------------------
-- A guest can pay for an expedition without an account. We capture their
-- email and/or phone in `guest_contacts`. When they later sign up with the
-- same email or phone, a trigger links the existing orders to the new
-- profile so they automatically appear under "My trips" in the mobile app.
-- ============================================================================

do $$ begin
  if not exists (select 1 from pg_type where typname = 'order_status') then
    create type public.order_status as enum
      ('pending','approved','declined','voided','error','refunded');
  end if;
end $$;

-- ---------- guest_contacts -------------------------------------------------
create table if not exists public.guest_contacts (
  id uuid primary key default gen_random_uuid(),
  email text,
  phone text,
  display_name text,
  -- When the guest later signs up, we set these fields and merge their orders.
  claimed_by_profile_id uuid references public.profiles(id) on delete set null,
  claimed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint guest_contacts_one_method check (email is not null or phone is not null)
);

-- Email is case-insensitive, phone is exact-match. Partial unique indexes so
-- nullable values don't collide.
create unique index if not exists guest_contacts_email_uniq
  on public.guest_contacts (lower(email)) where email is not null;
create unique index if not exists guest_contacts_phone_uniq
  on public.guest_contacts (phone) where phone is not null;

create trigger guest_contacts_touch
  before update on public.guest_contacts
  for each row execute function public.touch_updated_at();

-- ---------- orders ---------------------------------------------------------
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  expedition_id uuid not null references public.expeditions(id) on delete restrict,
  buyer_profile_id uuid references public.profiles(id) on delete set null,
  buyer_guest_contact_id uuid references public.guest_contacts(id) on delete set null,

  amount_cents integer not null check (amount_cents > 0),
  currency text not null default 'COP',

  status public.order_status not null default 'pending',

  -- Wompi-side identifiers. `reference` is what we send to the widget and
  -- what the webhook echoes back.
  wompi_reference text not null unique,
  wompi_transaction_id text,
  wompi_payment_method_type text,
  wompi_status_message text,

  metadata jsonb,

  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint orders_buyer_required
    check (buyer_profile_id is not null or buyer_guest_contact_id is not null)
);

create index if not exists orders_buyer_profile_idx
  on public.orders (buyer_profile_id) where buyer_profile_id is not null;
create index if not exists orders_buyer_guest_idx
  on public.orders (buyer_guest_contact_id) where buyer_guest_contact_id is not null;
create index if not exists orders_status_idx
  on public.orders (status, created_at desc);
create index if not exists orders_expedition_idx
  on public.orders (expedition_id);

create trigger orders_touch
  before update on public.orders
  for each row execute function public.touch_updated_at();

-- ---------- RLS for guest_contacts + orders --------------------------------
alter table public.guest_contacts enable row level security;
alter table public.orders enable row level security;

-- guest_contacts: only admins can read (PII) and rows are written exclusively
-- by Edge Functions using the service role.
drop policy if exists "admins read guest contacts" on public.guest_contacts;
create policy "admins read guest contacts"
  on public.guest_contacts for select
  using (public.is_admin());

drop policy if exists "admins manage guest contacts" on public.guest_contacts;
create policy "admins manage guest contacts"
  on public.guest_contacts for all
  using (public.is_admin())
  with check (public.is_admin());

-- orders:
--   - admins see everything
--   - signed-in users see their own orders
drop policy if exists "admins read orders" on public.orders;
create policy "admins read orders"
  on public.orders for select
  using (public.is_admin());

drop policy if exists "users read own orders" on public.orders;
create policy "users read own orders"
  on public.orders for select
  using (buyer_profile_id is not null and buyer_profile_id = auth.uid());

drop policy if exists "admins manage orders" on public.orders;
create policy "admins manage orders"
  on public.orders for all
  using (public.is_admin())
  with check (public.is_admin());

-- Inserts come from Edge Functions via service role and bypass RLS, so we
-- intentionally do NOT add an anon-insert policy here.

-- ---------- Account claim --------------------------------------------------
-- When a new auth.users row arrives, find any guest_contacts that match by
-- email or phone, attach this profile, and re-link their orders.
create or replace function public.claim_guest_contacts_for_user(p_user uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_email text;
  v_phone text;
  v_contact_id uuid;
begin
  select au.email, au.phone into v_email, v_phone
    from auth.users au
   where au.id = p_user;

  for v_contact_id in
    select id from public.guest_contacts
     where claimed_by_profile_id is null
       and (
         (v_email is not null and lower(email) = lower(v_email))
         or (v_phone is not null and phone = v_phone)
       )
  loop
    update public.guest_contacts
       set claimed_by_profile_id = p_user,
           claimed_at = now()
     where id = v_contact_id;

    update public.orders
       set buyer_profile_id = p_user
     where buyer_guest_contact_id = v_contact_id
       and buyer_profile_id is null;
  end loop;
end;
$$;

grant execute on function public.claim_guest_contacts_for_user(uuid) to authenticated;

-- Hook into the existing handle_new_auth_user pipeline. The trigger order
-- matters: the existing trigger creates the profile row FIRST, then this
-- one runs the claim. Postgres triggers fire in alphabetical order, so we
-- name this trigger to come after `on_auth_user_created`.
create or replace function public.on_auth_user_claim_guests()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform public.claim_guest_contacts_for_user(new.id);
  return new;
end;
$$;

drop trigger if exists zz_on_auth_user_claim_guests on auth.users;
create trigger zz_on_auth_user_claim_guests
  after insert on auth.users
  for each row execute function public.on_auth_user_claim_guests();
