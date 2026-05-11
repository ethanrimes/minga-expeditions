-- ============================================================================
-- Row Level Security · Minga Expeditions
-- Principle: all PII-free public data (profiles, published expeditions, photos,
-- comments, likes, ratings) is readable by anon. Writes only by owner.
-- Activities and raw track points are private per-user.
-- ============================================================================

alter table public.profiles            enable row level security;
alter table public.expeditions         enable row level security;
alter table public.expedition_photos   enable row level security;
alter table public.photo_attributions  enable row level security;
alter table public.activities          enable row level security;
alter table public.activity_tracks     enable row level security;
alter table public.comments            enable row level security;
alter table public.likes               enable row level security;
alter table public.ratings             enable row level security;

-- ---------- profiles --------------------------------------------------------
create policy "profiles readable by all"
  on public.profiles for select
  using (true);

create policy "users insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "users update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- ---------- expeditions -----------------------------------------------------
create policy "published expeditions readable by all"
  on public.expeditions for select
  using (is_published = true or author_id = auth.uid());

create policy "authors insert own expedition"
  on public.expeditions for insert
  with check (auth.uid() = author_id);

create policy "authors update own expedition"
  on public.expeditions for update
  using (auth.uid() = author_id)
  with check (auth.uid() = author_id);

create policy "authors delete own expedition"
  on public.expeditions for delete
  using (auth.uid() = author_id);

-- ---------- expedition_photos ----------------------------------------------
create policy "photos readable when parent is"
  on public.expedition_photos for select
  using (
    exists (
      select 1 from public.expeditions e
      where e.id = expedition_photos.expedition_id
        and (e.is_published = true or e.author_id = auth.uid())
    )
  );

create policy "photos insert by expedition author"
  on public.expedition_photos for insert
  with check (
    exists (
      select 1 from public.expeditions e
      where e.id = expedition_photos.expedition_id
        and e.author_id = auth.uid()
    )
  );

create policy "photos update/delete by expedition author"
  on public.expedition_photos for update
  using (
    exists (
      select 1 from public.expeditions e
      where e.id = expedition_photos.expedition_id
        and e.author_id = auth.uid()
    )
  );

create policy "photos delete by expedition author"
  on public.expedition_photos for delete
  using (
    exists (
      select 1 from public.expeditions e
      where e.id = expedition_photos.expedition_id
        and e.author_id = auth.uid()
    )
  );

-- ---------- photo_attributions ---------------------------------------------
create policy "attributions readable by all"
  on public.photo_attributions for select
  using (true);

-- Writes only via service_role (seed scripts, admin tooling).

-- ---------- activities (private per-user) ----------------------------------
create policy "users read own activities"
  on public.activities for select
  using (auth.uid() = user_id);

create policy "users insert own activity"
  on public.activities for insert
  with check (auth.uid() = user_id);

create policy "users update own activity"
  on public.activities for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "users delete own activity"
  on public.activities for delete
  using (auth.uid() = user_id);

-- ---------- activity_tracks (private per-user via parent) ------------------
create policy "users read own tracks"
  on public.activity_tracks for select
  using (
    exists (
      select 1 from public.activities a
      where a.id = activity_tracks.activity_id
        and a.user_id = auth.uid()
    )
  );

create policy "users insert tracks for own activity"
  on public.activity_tracks for insert
  with check (
    exists (
      select 1 from public.activities a
      where a.id = activity_tracks.activity_id
        and a.user_id = auth.uid()
    )
  );

create policy "users delete own tracks"
  on public.activity_tracks for delete
  using (
    exists (
      select 1 from public.activities a
      where a.id = activity_tracks.activity_id
        and a.user_id = auth.uid()
    )
  );

-- ---------- comments --------------------------------------------------------
create policy "comments readable by all"
  on public.comments for select
  using (true);

create policy "users post as themselves"
  on public.comments for insert
  with check (auth.uid() = author_id);

create policy "users delete own comment"
  on public.comments for delete
  using (auth.uid() = author_id);

-- ---------- likes -----------------------------------------------------------
create policy "likes readable by all"
  on public.likes for select
  using (true);

create policy "users like as themselves"
  on public.likes for insert
  with check (auth.uid() = user_id);

create policy "users unlike own like"
  on public.likes for delete
  using (auth.uid() = user_id);

-- ---------- ratings ---------------------------------------------------------
create policy "ratings readable by all"
  on public.ratings for select
  using (true);

create policy "users rate as themselves"
  on public.ratings for insert
  with check (auth.uid() = user_id);

create policy "users update own rating"
  on public.ratings for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "users delete own rating"
  on public.ratings for delete
  using (auth.uid() = user_id);
