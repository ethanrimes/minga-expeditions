-- ============================================================================
-- Avatars storage bucket.
--
-- Public-read bucket so any client (feed, expedition cards, share-card edge
-- function) can render avatars without signing URLs. Writes are gated to the
-- caller's own folder: object path convention is `<auth.uid()>/...`. Mirrors
-- the rules used by the activity-photos bucket.
--
-- `profiles.avatar_url` already exists; the app stores the public URL there
-- so deleting + re-uploading is just an update on that text column.
-- ============================================================================

insert into storage.buckets (id, name, public)
  values ('avatars', 'avatars', true)
on conflict (id) do nothing;

drop policy if exists "avatars public read" on storage.objects;
create policy "avatars public read"
  on storage.objects for select
  using (bucket_id = 'avatars');

drop policy if exists "avatars owner write" on storage.objects;
create policy "avatars owner write"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and split_part(name, '/', 1) = auth.uid()::text
  );

drop policy if exists "avatars owner update" on storage.objects;
create policy "avatars owner update"
  on storage.objects for update
  using (
    bucket_id = 'avatars'
    and split_part(name, '/', 1) = auth.uid()::text
  );

drop policy if exists "avatars owner delete" on storage.objects;
create policy "avatars owner delete"
  on storage.objects for delete
  using (
    bucket_id = 'avatars'
    and split_part(name, '/', 1) = auth.uid()::text
  );
