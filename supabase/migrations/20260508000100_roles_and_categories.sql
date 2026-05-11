-- ============================================================================
-- Phase 0 · Roles + dynamic categories
-- ----------------------------------------------------------------------------
-- Why this migration exists:
--   1. Admin website needs a way to gate writes to categories + expeditions
--      without service-role tokens leaking into the browser. We introduce an
--      `app_role` enum on profiles and let RLS policies key off `auth.uid()`.
--   2. Categories were a hardcoded Postgres enum. The admin UI needs to
--      add/rename/reorder/disable them. We migrate to a real `categories`
--      table whose `slug` matches the old enum literal so existing reads keep
--      working. The legacy `expeditions.category` column stays for backward
--      compatibility — it will be dropped in a later migration once the mobile
--      client reads `category_id` exclusively.
-- ============================================================================

-- ---------- app_role + profiles.role ---------------------------------------
do $$ begin
  if not exists (select 1 from pg_type where typname = 'app_role') then
    create type public.app_role as enum ('user','admin','vendor');
  end if;
end $$;

alter table public.profiles
  add column if not exists role public.app_role not null default 'user';

create index if not exists profiles_role_idx on public.profiles (role);

-- helper: stable, schema-qualified, marked stable so RLS planner can inline it
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  );
$$;

grant execute on function public.is_admin() to anon, authenticated;

-- ---------- categories table -----------------------------------------------
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name_en text not null,
  name_es text not null,
  icon_name text,                       -- maps to packages/ui Icon name union
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists categories_active_sort_idx
  on public.categories (is_active, sort_order);

create trigger categories_touch
  before update on public.categories
  for each row execute function public.touch_updated_at();

-- Seed from the existing enum literals. Names mirror the i18n keys the mobile
-- app already ships (cat.hiking, cat.cycling, ...). Icons match the
-- packages/ui Icon name union so the mobile UI can render them dynamically.
insert into public.categories (slug, name_en, name_es, icon_name, sort_order) values
  ('hiking',   'Hiking',   'Senderismo',     'mountain',      10),
  ('cycling',  'Cycling',  'Ciclismo',       'bike',          20),
  ('running',  'Running',  'Trail running',  'footprints',    30),
  ('trekking', 'Trekking', 'Trekking',       'mountain-snow', 40),
  ('cultural', 'Cultural', 'Cultural',       'drama',         50),
  ('wildlife', 'Wildlife', 'Vida silvestre', 'leaf',          60),
  ('other',    'Other',    'Otro',           'sparkles',      99)
on conflict (slug) do update set
  name_en    = excluded.name_en,
  name_es    = excluded.name_es,
  icon_name  = excluded.icon_name,
  sort_order = excluded.sort_order;

-- ---------- expeditions.category_id ----------------------------------------
alter table public.expeditions
  add column if not exists category_id uuid references public.categories(id) on delete restrict;

-- Backfill from the legacy enum column.
update public.expeditions e
   set category_id = c.id
  from public.categories c
 where e.category::text = c.slug
   and e.category_id is null;

-- Once backfilled, every row should have a category_id. Enforce it.
alter table public.expeditions
  alter column category_id set not null;

create index if not exists expeditions_category_id_idx
  on public.expeditions (category_id);

-- Keep the legacy `category` column in sync if a writer only sets category_id.
-- (And vice versa, so old writers that set `category` get a category_id.)
create or replace function public.expeditions_sync_category()
returns trigger language plpgsql as $$
declare
  v_slug text;
  v_id uuid;
begin
  if tg_op = 'INSERT' or new.category_id is distinct from old.category_id then
    if new.category_id is not null then
      select slug into v_slug from public.categories where id = new.category_id;
      if v_slug is not null then new.category := v_slug::public.expedition_category; end if;
    end if;
  end if;
  if tg_op = 'INSERT' or new.category is distinct from old.category then
    if new.category is not null and new.category_id is null then
      select id into v_id from public.categories where slug = new.category::text;
      if v_id is not null then new.category_id := v_id; end if;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists expeditions_sync_category on public.expeditions;
create trigger expeditions_sync_category
  before insert or update on public.expeditions
  for each row execute function public.expeditions_sync_category();

-- ---------- RLS for categories ---------------------------------------------
alter table public.categories enable row level security;

drop policy if exists "categories readable by all" on public.categories;
create policy "categories readable by all"
  on public.categories for select
  using (true);

drop policy if exists "categories writable by admin" on public.categories;
create policy "categories writable by admin"
  on public.categories for all
  using (public.is_admin())
  with check (public.is_admin());

-- ---------- Admin can manage any expedition / photo ------------------------
drop policy if exists "admins manage all expeditions" on public.expeditions;
create policy "admins manage all expeditions"
  on public.expeditions for all
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "admins manage all expedition photos" on public.expedition_photos;
create policy "admins manage all expedition photos"
  on public.expedition_photos for all
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "admins read all profiles" on public.profiles;
create policy "admins read all profiles"
  on public.profiles for select
  using (public.is_admin() or true);

drop policy if exists "admins update any profile" on public.profiles;
create policy "admins update any profile"
  on public.profiles for update
  using (public.is_admin())
  with check (public.is_admin());

-- ---------- Storage bucket for expedition cover images ---------------------
-- The admin uploads cover images to this bucket. Public read; writes restricted
-- to authenticated admins via storage RLS.
insert into storage.buckets (id, name, public)
  values ('expedition-photos', 'expedition-photos', true)
on conflict (id) do nothing;

drop policy if exists "expedition photos public read" on storage.objects;
create policy "expedition photos public read"
  on storage.objects for select
  using (bucket_id = 'expedition-photos');

drop policy if exists "expedition photos admin write" on storage.objects;
create policy "expedition photos admin write"
  on storage.objects for insert
  with check (bucket_id = 'expedition-photos' and public.is_admin());

drop policy if exists "expedition photos admin update" on storage.objects;
create policy "expedition photos admin update"
  on storage.objects for update
  using (bucket_id = 'expedition-photos' and public.is_admin())
  with check (bucket_id = 'expedition-photos' and public.is_admin());

drop policy if exists "expedition photos admin delete" on storage.objects;
create policy "expedition photos admin delete"
  on storage.objects for delete
  using (bucket_id = 'expedition-photos' and public.is_admin());
