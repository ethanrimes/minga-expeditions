-- ============================================================================
-- Admin restructure · Phase 3 · Multi-template comms + placeholder registry
-- ----------------------------------------------------------------------------
-- The admin "Communications" page needs to:
--   1. Hold multiple templates per (event, locale, channel) with exactly one
--      marked active. Switching the active one shuffles the active to the
--      top in the UI; the rest stay around as drafts/history.
--   2. Show which `{placeholder}` tokens are actually available for a given
--      event so the admin can build a valid template. We register the
--      allowed tokens on `comm_event_types.placeholders` and the send-time
--      Edge Function will validate against the same list before substituting.
-- ============================================================================

-- ---------- 1 · drop the strict uniqueness, allow many per combo ----------
-- The original constraint was created inline as
-- `unique (event_key, locale, channel)` which PG names
-- `comm_templates_event_key_locale_channel_key`.
do $$ begin
  if exists (
    select 1 from pg_constraint
    where conname = 'comm_templates_event_key_locale_channel_key'
      and conrelid = 'public.comm_templates'::regclass
  ) then
    alter table public.comm_templates
      drop constraint comm_templates_event_key_locale_channel_key;
  end if;
end $$;

-- Each template carries a human label ("Friendly", "Formal", "Holiday tone").
-- Existing rows get a placeholder so the NOT NULL backfill is clean.
alter table public.comm_templates
  add column if not exists name text;

update public.comm_templates
   set name = 'Default'
 where name is null;

alter table public.comm_templates
  alter column name set not null;

alter table public.comm_templates
  add constraint comm_templates_name_length check (length(name) between 1 and 120);

-- Exactly one active template per (event, locale, channel). Partial unique
-- index instead of a full UNIQUE so inactive drafts can pile up freely.
drop index if exists comm_templates_active_uniq;
create unique index comm_templates_active_uniq
  on public.comm_templates (event_key, locale, channel)
  where is_active = true;

-- Helper: flip the active template for a given combo atomically. The admin
-- UI's "make active" toggle calls this so we never end up with two active
-- rows mid-transaction.
create or replace function public.comm_templates_set_active(p_template_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_event text;
  v_locale text;
  v_channel text;
begin
  if not public.is_admin() then
    raise exception 'admin only';
  end if;

  select event_key, locale, channel
    into v_event, v_locale, v_channel
    from public.comm_templates
   where id = p_template_id;

  if v_event is null then
    raise exception 'template % not found', p_template_id;
  end if;

  update public.comm_templates
     set is_active = false
   where event_key = v_event
     and locale    = v_locale
     and channel   = v_channel
     and id <> p_template_id
     and is_active = true;

  update public.comm_templates
     set is_active = true
   where id = p_template_id;
end;
$$;

grant execute on function public.comm_templates_set_active(uuid) to authenticated;

-- ---------- 2 · placeholder registry on comm_event_types ------------------
-- Each entry: {"key": "display_name", "label": "User display name",
--              "example": "Andrea G.", "source": "profile.display_name"}
-- `source` is informational — the actual binding lives in the send-time
-- Edge Function (TODO follow-up). Keeping it here lets the admin UI render
-- "this template references {x} which isn't a valid placeholder" warnings.
alter table public.comm_event_types
  add column if not exists placeholders jsonb not null default '[]'::jsonb;

-- Seed the registry for the known events.
update public.comm_event_types set placeholders = $json$[
  {"key":"display_name","label":"User display name","source":"profile.display_name","example":"Andrea G."},
  {"key":"username","label":"User handle","source":"profile.username","example":"andrea"},
  {"key":"email","label":"User email","source":"auth.users.email","example":"andrea@example.com"}
]$json$::jsonb
where key = 'account.created';

update public.comm_event_types set placeholders = $json$[
  {"key":"display_name","label":"User display name","source":"profile.display_name"},
  {"key":"expedition_title","label":"Expedition title","source":"expeditions.title"},
  {"key":"salida_starts_at","label":"Departure date/time","source":"expedition_salidas.starts_at","format":"localized datetime"},
  {"key":"salida_ends_at","label":"Return date/time","source":"expedition_salidas.ends_at"},
  {"key":"location_name","label":"Trip location","source":"expeditions.location_name"},
  {"key":"provider_name","label":"Operating provider","source":"providers.display_name"},
  {"key":"price","label":"Total paid (formatted)","source":"orders.amount_cents + currency"}
]$json$::jsonb
where key = 'expedition.signed_up';

update public.comm_event_types set placeholders = $json$[
  {"key":"display_name","label":"User display name","source":"profile.display_name"},
  {"key":"expedition_title","label":"Expedition title","source":"expeditions.title"},
  {"key":"distance_km","label":"Distance covered (km)","source":"participations.ack_distance_km"},
  {"key":"elevation_m","label":"Elevation gain (m)","source":"participations.ack_elevation_m"},
  {"key":"provider_name","label":"Operating provider","source":"providers.display_name"}
]$json$::jsonb
where key = 'expedition.completed';

update public.comm_event_types set placeholders = $json$[
  {"key":"display_name","label":"User display name","source":"profile.display_name"},
  {"key":"expedition_title","label":"Expedition title","source":"expeditions.title"},
  {"key":"days_since_completion","label":"Days since the trip","source":"now() - participations.attended_at"}
]$json$::jsonb
where key = 'review.reminder';

update public.comm_event_types set placeholders = $json$[
  {"key":"display_name","label":"User display name","source":"profile.display_name"},
  {"key":"new_tier","label":"New tier reached","source":"profile.tier"},
  {"key":"total_distance_km","label":"Lifetime distance (km)","source":"profile.total_distance_km"}
]$json$::jsonb
where key = 'tier.leveled_up';
