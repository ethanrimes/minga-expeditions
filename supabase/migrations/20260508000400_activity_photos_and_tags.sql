-- ============================================================================
-- Phase 5 · Activity photos + terrain tags
-- ----------------------------------------------------------------------------
-- Extends the existing `activities` table with rich post-stop metadata: a
-- terrain tag set the user picks from (mountain, flat, desert, river, …) and
-- a `is_independent` flag that distinguishes "this was a Minga expedition"
-- from "I went on my own walk." Photos go into a new `activity_photos`
-- table backed by a Supabase storage bucket.
-- ============================================================================

-- ---------- terrain tags ---------------------------------------------------
do $$ begin
  if not exists (select 1 from pg_type where typname = 'terrain_tag') then
    create type public.terrain_tag as enum
      ('mountain','flat','desert','river','forest','coast','urban','jungle','snow');
  end if;
end $$;

alter table public.activities
  add column if not exists terrain_tags public.terrain_tag[] not null default '{}',
  add column if not exists is_independent boolean not null default true;

-- An activity is "independent" when it isn't tied to a paid Minga expedition.
-- Backfill: any row whose expedition_id is set is non-independent.
update public.activities
   set is_independent = (expedition_id is null)
 where true;

create index if not exists activities_terrain_tags_idx
  on public.activities using gin (terrain_tags);

-- ---------- activity_photos ------------------------------------------------
create table if not exists public.activity_photos (
  id uuid primary key default gen_random_uuid(),
  activity_id uuid not null references public.activities(id) on delete cascade,
  url text not null,
  caption text,
  taken_at timestamptz,
  lat double precision,
  lng double precision,
  order_index integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists activity_photos_parent_idx
  on public.activity_photos (activity_id, order_index);

alter table public.activity_photos enable row level security;

drop policy if exists "users read own activity photos" on public.activity_photos;
create policy "users read own activity photos"
  on public.activity_photos for select
  using (
    exists (
      select 1 from public.activities a
      where a.id = activity_photos.activity_id
        and a.user_id = auth.uid()
    )
  );

drop policy if exists "users insert own activity photos" on public.activity_photos;
create policy "users insert own activity photos"
  on public.activity_photos for insert
  with check (
    exists (
      select 1 from public.activities a
      where a.id = activity_photos.activity_id
        and a.user_id = auth.uid()
    )
  );

drop policy if exists "users delete own activity photos" on public.activity_photos;
create policy "users delete own activity photos"
  on public.activity_photos for delete
  using (
    exists (
      select 1 from public.activities a
      where a.id = activity_photos.activity_id
        and a.user_id = auth.uid()
    )
  );

-- ---------- storage bucket -------------------------------------------------
insert into storage.buckets (id, name, public)
  values ('activity-photos', 'activity-photos', true)
on conflict (id) do nothing;

drop policy if exists "activity photos public read" on storage.objects;
create policy "activity photos public read"
  on storage.objects for select
  using (bucket_id = 'activity-photos');

-- The object path convention is `<auth.uid()>/<random>-<filename>`. The
-- policy enforces that the first segment matches the caller's id so users
-- can only write to their own folder.
drop policy if exists "activity photos owner write" on storage.objects;
create policy "activity photos owner write"
  on storage.objects for insert
  with check (
    bucket_id = 'activity-photos'
    and split_part(name, '/', 1) = auth.uid()::text
  );

drop policy if exists "activity photos owner delete" on storage.objects;
create policy "activity photos owner delete"
  on storage.objects for delete
  using (
    bucket_id = 'activity-photos'
    and split_part(name, '/', 1) = auth.uid()::text
  );
