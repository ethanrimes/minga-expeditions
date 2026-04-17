-- ============================================================================
-- Activity-scoped feedback: personal notes + a self-rating per activity.
-- Design: strictly private per-owner. An activity is the user's own outing
-- (Strava-style), so comments here are a journal and the rating is how the
-- user remembers the experience. Opening this to other users is a later step.
-- ============================================================================

create table if not exists public.activity_comments (
  id uuid primary key default gen_random_uuid(),
  activity_id uuid not null references public.activities(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (length(body) between 1 and 4000),
  created_at timestamptz not null default now()
);

create index if not exists activity_comments_activity_idx
  on public.activity_comments (activity_id, created_at);

create table if not exists public.activity_ratings (
  user_id uuid not null references public.profiles(id) on delete cascade,
  activity_id uuid not null references public.activities(id) on delete cascade,
  stars smallint not null check (stars between 1 and 5),
  review text,
  created_at timestamptz not null default now(),
  primary key (user_id, activity_id)
);

alter table public.activity_comments enable row level security;
alter table public.activity_ratings  enable row level security;

-- ------ activity_comments -------------------------------------------------
-- Read / write scoped to the owner of the parent activity.
drop policy if exists "owner reads own activity comments" on public.activity_comments;
create policy "owner reads own activity comments"
  on public.activity_comments for select
  using (
    exists (
      select 1 from public.activities a
      where a.id = activity_comments.activity_id
        and a.user_id = auth.uid()
    )
  );

drop policy if exists "owner writes own activity comments" on public.activity_comments;
create policy "owner writes own activity comments"
  on public.activity_comments for insert
  with check (
    auth.uid() = author_id
    and exists (
      select 1 from public.activities a
      where a.id = activity_comments.activity_id
        and a.user_id = auth.uid()
    )
  );

drop policy if exists "author deletes own activity comments" on public.activity_comments;
create policy "author deletes own activity comments"
  on public.activity_comments for delete
  using (auth.uid() = author_id);

-- ------ activity_ratings --------------------------------------------------
drop policy if exists "owner reads own activity rating" on public.activity_ratings;
create policy "owner reads own activity rating"
  on public.activity_ratings for select
  using (
    auth.uid() = user_id
    and exists (
      select 1 from public.activities a
      where a.id = activity_ratings.activity_id
        and a.user_id = auth.uid()
    )
  );

drop policy if exists "owner writes own activity rating" on public.activity_ratings;
create policy "owner writes own activity rating"
  on public.activity_ratings for insert
  with check (auth.uid() = user_id);

drop policy if exists "owner updates own activity rating" on public.activity_ratings;
create policy "owner updates own activity rating"
  on public.activity_ratings for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "owner deletes own activity rating" on public.activity_ratings;
create policy "owner deletes own activity rating"
  on public.activity_ratings for delete
  using (auth.uid() = user_id);
