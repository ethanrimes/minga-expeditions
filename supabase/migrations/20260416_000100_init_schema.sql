-- ============================================================================
-- Minga Expeditions · initial schema
-- Creates the core domain tables for the traveler community app.
-- Design notes:
--   - profiles.id is a plain UUID — NOT a FK to auth.users so the seed can
--     insert demo authors without provisioning auth entries. A trigger below
--     links real sign-ups to a profile row.
--   - All user-visible tables enable RLS; policies live in the next migration.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ---------- enums -----------------------------------------------------------
create type public.expedition_category as enum
  ('hiking','cycling','running','trekking','cultural','wildlife','other');

create type public.tier_level as enum ('bronze','silver','gold','diamond');

create type public.activity_type as enum ('hike','ride','run','walk');

-- ---------- profiles --------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  username text not null unique,
  display_name text not null,
  avatar_url text,
  bio text,
  home_country text,
  total_distance_km numeric(10,2) not null default 0,
  total_elevation_m numeric(10,1) not null default 0,
  tier public.tier_level not null default 'bronze',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists profiles_tier_idx on public.profiles (tier);

-- ---------- photo attributions ---------------------------------------------
create table if not exists public.photo_attributions (
  id uuid primary key default gen_random_uuid(),
  photographer_name text not null,
  source_url text not null,
  license text not null,
  license_url text,
  notes text
);

-- ---------- expeditions ----------------------------------------------------
create table if not exists public.expeditions (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text not null,
  category public.expedition_category not null,
  location_name text not null,
  region text,
  country text not null default 'Colombia',
  start_lat double precision,
  start_lng double precision,
  distance_km numeric(10,2),
  elevation_gain_m numeric(10,1),
  difficulty smallint not null default 3 check (difficulty between 1 and 5),
  price_cents integer not null default 0 check (price_cents >= 0),
  currency text not null default 'COP',
  cover_photo_url text,
  is_official boolean not null default false,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists expeditions_published_idx on public.expeditions (is_published, created_at desc);
create index if not exists expeditions_category_idx on public.expeditions (category);

-- ---------- expedition photos ----------------------------------------------
create table if not exists public.expedition_photos (
  id uuid primary key default gen_random_uuid(),
  expedition_id uuid not null references public.expeditions(id) on delete cascade,
  url text not null,
  caption text,
  order_index integer not null default 0,
  attribution_id uuid references public.photo_attributions(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists expedition_photos_parent_idx on public.expedition_photos (expedition_id, order_index);

-- ---------- activities -----------------------------------------------------
create table if not exists public.activities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  expedition_id uuid references public.expeditions(id) on delete set null,
  activity_type public.activity_type not null,
  title text not null,
  started_at timestamptz not null,
  ended_at timestamptz,
  distance_km numeric(10,2) not null default 0,
  elevation_gain_m numeric(10,1) not null default 0,
  duration_seconds integer not null default 0,
  avg_speed_kmh numeric(6,2),
  cover_photo_url text,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists activities_user_idx on public.activities (user_id, started_at desc);

-- ---------- activity tracks ------------------------------------------------
create table if not exists public.activity_tracks (
  id uuid primary key default gen_random_uuid(),
  activity_id uuid not null references public.activities(id) on delete cascade,
  recorded_at timestamptz not null,
  lat double precision not null,
  lng double precision not null,
  altitude_m double precision,
  speed_ms double precision,
  sequence integer not null
);

create index if not exists activity_tracks_activity_idx on public.activity_tracks (activity_id, sequence);

-- ---------- comments (threaded) --------------------------------------------
create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  expedition_id uuid not null references public.expeditions(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  parent_id uuid references public.comments(id) on delete cascade,
  body text not null check (length(body) between 1 and 4000),
  created_at timestamptz not null default now()
);

create index if not exists comments_expedition_idx on public.comments (expedition_id, created_at);
create index if not exists comments_parent_idx on public.comments (parent_id);

-- ---------- likes ----------------------------------------------------------
create table if not exists public.likes (
  user_id uuid not null references public.profiles(id) on delete cascade,
  expedition_id uuid not null references public.expeditions(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, expedition_id)
);

-- ---------- ratings --------------------------------------------------------
create table if not exists public.ratings (
  user_id uuid not null references public.profiles(id) on delete cascade,
  expedition_id uuid not null references public.expeditions(id) on delete cascade,
  stars smallint not null check (stars between 1 and 5),
  review text,
  created_at timestamptz not null default now(),
  primary key (user_id, expedition_id)
);

-- ---------- housekeeping: updated_at trigger -------------------------------
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_touch
before update on public.profiles
for each row execute function public.touch_updated_at();

create trigger expeditions_touch
before update on public.expeditions
for each row execute function public.touch_updated_at();

-- ---------- link auth.users → profiles on signup ---------------------------
-- Supabase creates a row in auth.users when someone signs up. We mirror that
-- into public.profiles, pulling display_name/username out of the raw_user_meta_data
-- the client sent. Fallback to email local-part.
create or replace function public.handle_new_auth_user()
returns trigger language plpgsql security definer as $$
declare
  v_display text;
  v_username text;
  v_base text;
  v_candidate text;
  v_counter int := 0;
begin
  v_display := coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email,'@',1));
  v_base := regexp_replace(coalesce(new.raw_user_meta_data->>'username', split_part(new.email,'@',1)), '[^a-zA-Z0-9_.-]', '', 'g');
  if v_base = '' then v_base := 'user'; end if;

  -- Find a unique username by appending an integer suffix if necessary.
  v_candidate := v_base;
  while exists (select 1 from public.profiles where username = v_candidate) loop
    v_counter := v_counter + 1;
    v_candidate := v_base || v_counter::text;
  end loop;

  insert into public.profiles (id, username, display_name)
  values (new.id, v_candidate, v_display)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_auth_user();

-- ---------- keep profile totals fresh --------------------------------------
-- Whenever an activity row changes, refresh the owning profile's totals and tier.
create or replace function public.refresh_profile_totals(p_user uuid)
returns void language plpgsql as $$
declare
  v_dist numeric;
  v_elev numeric;
  v_tier public.tier_level;
begin
  select coalesce(sum(distance_km),0), coalesce(sum(elevation_gain_m),0)
    into v_dist, v_elev
    from public.activities
   where user_id = p_user;

  v_tier := case
    when v_dist >= 2000 then 'diamond'::public.tier_level
    when v_dist >= 500  then 'gold'::public.tier_level
    when v_dist >= 100  then 'silver'::public.tier_level
    else 'bronze'::public.tier_level
  end;

  update public.profiles
     set total_distance_km = v_dist,
         total_elevation_m = v_elev,
         tier = v_tier
   where id = p_user;
end;
$$;

create or replace function public.activities_after_change()
returns trigger language plpgsql as $$
begin
  if tg_op = 'DELETE' then
    perform public.refresh_profile_totals(old.user_id);
  else
    perform public.refresh_profile_totals(new.user_id);
  end if;
  return null;
end;
$$;

create trigger activities_totals_sync
after insert or update or delete on public.activities
for each row execute function public.activities_after_change();
