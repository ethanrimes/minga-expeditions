-- ============================================================================
-- Let anonymous (email-less) users get a usable profile row.
-- Supabase's `supabase.auth.signInAnonymously()` creates an auth.users row
-- with a null email; our existing handle_new_auth_user trigger used
-- split_part(new.email,'@',1), which returns null for these users and made
-- the profiles insert fail. Fall back to 'Guest' / a short random slug.
-- ============================================================================

create or replace function public.handle_new_auth_user()
returns trigger language plpgsql security definer as $$
declare
  v_display text;
  v_username text;
  v_base text;
  v_candidate text;
  v_counter int := 0;
begin
  v_display := coalesce(
    new.raw_user_meta_data->>'display_name',
    nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
    'Guest'
  );

  v_base := regexp_replace(
    coalesce(
      new.raw_user_meta_data->>'username',
      nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
      'guest-' || substr(md5(new.id::text), 1, 6)
    ),
    '[^a-zA-Z0-9_.-]', '', 'g'
  );
  if v_base is null or v_base = '' then
    v_base := 'guest-' || substr(md5(new.id::text), 1, 6);
  end if;

  -- Append integer suffix if username is already taken.
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
