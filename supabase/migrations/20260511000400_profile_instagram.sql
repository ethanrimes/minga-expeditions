-- ============================================================================
-- Profile Instagram handle.
--
-- Adds the user's Instagram username to their profile so the booking
-- confirmation card, share-card generator, and admin support tools can deep
-- link to their feed. Stored without the leading `@` and lowercased so look-
-- ups are case-insensitive (Instagram handles themselves are case-insensitive).
--
-- Existing RLS on profiles already covers this column:
--   - readable by all (display name etc. are public)
--   - update gated to auth.uid() = id
-- ============================================================================

alter table public.profiles
  add column if not exists instagram_handle text;

-- Instagram allows 1–30 chars: letters, numbers, periods, underscores.
-- We enforce the format and the no-leading-@ rule at the DB layer so any
-- future writer (admin, edge function, future mobile flow) gets the same
-- guarantee the UI gives.
do $$ begin
  if not exists (
    select 1 from pg_constraint where conname = 'profiles_instagram_handle_format'
  ) then
    alter table public.profiles
      add constraint profiles_instagram_handle_format
      check (
        instagram_handle is null
        or instagram_handle ~ '^[a-z0-9._]{1,30}$'
      );
  end if;
end $$;

create index if not exists profiles_instagram_idx
  on public.profiles (instagram_handle)
  where instagram_handle is not null;
