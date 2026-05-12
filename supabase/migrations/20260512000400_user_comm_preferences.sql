-- ============================================================================
-- Admin restructure · Phase 4 · User communication preferences
-- ----------------------------------------------------------------------------
-- The admin user-profile drilldown needs to show "which communications is
-- this user subscribed to?". The send-time pipeline also needs to skip
-- events a user has opted out of. Default behaviour: subscribed unless an
-- explicit row says otherwise — store rows only when the user diverges
-- from the default so we don't bloat the table.
-- ============================================================================

create table if not exists public.user_comm_preferences (
  user_id uuid not null references public.profiles(id) on delete cascade,
  event_key text not null references public.comm_event_types(key) on delete cascade,
  channel text not null check (channel in ('email','whatsapp')),
  is_subscribed boolean not null default true,
  updated_at timestamptz not null default now(),
  primary key (user_id, event_key, channel)
);

create index if not exists user_comm_prefs_event_idx
  on public.user_comm_preferences (event_key, channel) where is_subscribed = false;

create or replace function public.user_comm_preferences_touch()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists user_comm_prefs_touch on public.user_comm_preferences;
create trigger user_comm_prefs_touch
  before update on public.user_comm_preferences
  for each row execute function public.user_comm_preferences_touch();

-- ---------- RLS ------------------------------------------------------------
alter table public.user_comm_preferences enable row level security;

drop policy if exists "users read own comm prefs" on public.user_comm_preferences;
create policy "users read own comm prefs"
  on public.user_comm_preferences for select
  using (user_id = auth.uid());

drop policy if exists "users write own comm prefs" on public.user_comm_preferences;
create policy "users write own comm prefs"
  on public.user_comm_preferences for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "admins read comm prefs" on public.user_comm_preferences;
create policy "admins read comm prefs"
  on public.user_comm_preferences for select
  using (public.is_admin());

drop policy if exists "admins write comm prefs" on public.user_comm_preferences;
create policy "admins write comm prefs"
  on public.user_comm_preferences for all
  using (public.is_admin()) with check (public.is_admin());

-- Convenience view for the admin profile page: returns the *effective*
-- subscription per (user, event, channel), defaulting to true when no row
-- exists. Lets the UI bind to a single row source instead of merging on
-- the client.
create or replace view public.user_comm_subscriptions as
select
  p.id        as user_id,
  e.key       as event_key,
  ch.channel  as channel,
  coalesce(pref.is_subscribed, true) as is_subscribed,
  pref.updated_at
from public.profiles p
cross join public.comm_event_types e
cross join (values ('email'), ('whatsapp')) as ch(channel)
left join public.user_comm_preferences pref
       on pref.user_id   = p.id
      and pref.event_key = e.key
      and pref.channel   = ch.channel;

grant select on public.user_comm_subscriptions to authenticated;
