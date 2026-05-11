-- ============================================================================
-- Phase 7 + 8 · Trip participations + configurable comms
-- ----------------------------------------------------------------------------
--   * participations: who attended which salida + the trip-completion popup
--     state + the organizer-side review of the guest.
--   * comm_event_types + comm_templates: configurable, per-event, per-locale,
--     per-channel message templates the admin can edit. The actual trigger
--     pipeline lives in an Edge Function (TODO follow-up); this migration
--     just stands up the storage + seeds the default templates.
-- ============================================================================

-- ---------- participations -------------------------------------------------
create table if not exists public.participations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  salida_id uuid not null references public.expedition_salidas(id) on delete cascade,
  expedition_id uuid not null references public.expeditions(id) on delete cascade,
  order_id uuid references public.orders(id) on delete set null,

  -- Snapshot of the user's tier the day they signed up. Lets us compute
  -- "leveled up during this trip" without a separate history table.
  tier_at_signup public.tier_level not null default 'bronze',

  attended_at timestamptz,
  completion_acknowledged_at timestamptz,

  -- Organizer-side review of the guest (Airbnb-style host review).
  organizer_review_stars smallint check (organizer_review_stars between 1 and 5),
  organizer_review_body text,
  organizer_reviewed_at timestamptz,
  organizer_reviewer_id uuid references public.profiles(id) on delete set null,

  -- Stats summary that fed the completion popup, captured at acknowledge
  -- time so the modal can keep working even if activities are deleted.
  ack_distance_km numeric(10,2),
  ack_elevation_m numeric(10,1),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, salida_id)
);

create index if not exists participations_user_unack_idx
  on public.participations (user_id)
  where completion_acknowledged_at is null;
create index if not exists participations_salida_idx
  on public.participations (salida_id);
create index if not exists participations_unreviewed_idx
  on public.participations (expedition_id)
  where organizer_reviewed_at is null;

create trigger participations_touch
  before update on public.participations
  for each row execute function public.touch_updated_at();

alter table public.participations enable row level security;

drop policy if exists "users read own participations" on public.participations;
create policy "users read own participations"
  on public.participations for select using (user_id = auth.uid());

drop policy if exists "expedition authors read participations" on public.participations;
create policy "expedition authors read participations"
  on public.participations for select
  using (
    exists (
      select 1 from public.expeditions e
      where e.id = participations.expedition_id and e.author_id = auth.uid()
    )
  );

drop policy if exists "admins read all participations" on public.participations;
create policy "admins read all participations"
  on public.participations for select using (public.is_admin());

drop policy if exists "users update own participation" on public.participations;
create policy "users update own participation"
  on public.participations for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "expedition authors review participants" on public.participations;
create policy "expedition authors review participants"
  on public.participations for update
  using (
    exists (
      select 1 from public.expeditions e
      where e.id = participations.expedition_id and e.author_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.expeditions e
      where e.id = participations.expedition_id and e.author_id = auth.uid()
    )
  );

drop policy if exists "admins manage participations" on public.participations;
create policy "admins manage participations"
  on public.participations for all
  using (public.is_admin()) with check (public.is_admin());

-- Auto-create a participation row when an order is approved. We snapshot the
-- user's current tier so a later level-up is detectable. Orders that have a
-- buyer_profile_id (signed-in purchaser) get a row immediately; guest
-- purchases skip until the account is claimed.
create or replace function public.orders_create_participation()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_tier public.tier_level;
begin
  if new.status = 'approved' and new.salida_id is not null and new.buyer_profile_id is not null then
    select tier into v_tier from public.profiles where id = new.buyer_profile_id;
    insert into public.participations (user_id, salida_id, expedition_id, order_id, tier_at_signup)
    values (new.buyer_profile_id, new.salida_id, new.expedition_id, new.id, coalesce(v_tier, 'bronze'))
    on conflict (user_id, salida_id) do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists orders_participation_sync on public.orders;
create trigger orders_participation_sync
  after insert or update on public.orders
  for each row execute function public.orders_create_participation();

-- ---------- comm event types + templates -----------------------------------
create table if not exists public.comm_event_types (
  key text primary key,
  description text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.comm_templates (
  id uuid primary key default gen_random_uuid(),
  event_key text not null references public.comm_event_types(key) on delete cascade,
  locale text not null,                   -- 'en' or 'es'
  channel text not null,                  -- 'email' | 'whatsapp'
  subject text,                           -- nullable for whatsapp (no subject line)
  body text not null,                     -- supports {placeholder} substitution
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (event_key, locale, channel)
);

create index if not exists comm_templates_event_idx on public.comm_templates (event_key);

create trigger comm_templates_touch
  before update on public.comm_templates
  for each row execute function public.touch_updated_at();

alter table public.comm_event_types enable row level security;
alter table public.comm_templates enable row level security;

drop policy if exists "comm event types readable" on public.comm_event_types;
create policy "comm event types readable"
  on public.comm_event_types for select using (true);

drop policy if exists "comm event types admin write" on public.comm_event_types;
create policy "comm event types admin write"
  on public.comm_event_types for all
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "comm templates admin only" on public.comm_templates;
create policy "comm templates admin only"
  on public.comm_templates for all
  using (public.is_admin()) with check (public.is_admin());

-- ---------- seed events + default templates --------------------------------
insert into public.comm_event_types (key, description) values
  ('account.created',        'Fires once when a user creates an account.'),
  ('expedition.signed_up',   'Fires when a user purchases or registers for a specific salida.'),
  ('expedition.completed',   'Fires N hours after the salida ends so the user gets a congrats / nudge to review.'),
  ('review.reminder',        'Periodic reminder to leave a review after completing a trip.'),
  ('tier.leveled_up',        'Fires when a user crosses into a higher tier (silver → gold etc.).')
on conflict (key) do nothing;

insert into public.comm_templates (event_key, locale, channel, subject, body) values
  ('account.created', 'es', 'email', '¡Bienvenido a Minga!',
   'Hola {display_name}, gracias por unirte a Minga Expeditions. Ya puedes explorar expediciones por toda Colombia.'),
  ('account.created', 'en', 'email', 'Welcome to Minga!',
   'Hi {display_name}, thanks for joining Minga Expeditions. Discover hikes, rides, and rivers across Colombia.'),

  ('expedition.signed_up', 'es', 'email', 'Reserva confirmada · {expedition_title}',
   'Hola {display_name}, tu reserva para {expedition_title} el {salida_starts_at} está confirmada. ¡Nos vemos en la ruta!'),
  ('expedition.signed_up', 'en', 'email', 'Booking confirmed · {expedition_title}',
   'Hi {display_name}, your booking for {expedition_title} on {salida_starts_at} is confirmed. See you on the trail!'),
  ('expedition.signed_up', 'es', 'whatsapp', null,
   '🌄 Minga: confirmamos tu salida a {expedition_title} el {salida_starts_at}. Te escribimos un día antes con los detalles.'),
  ('expedition.signed_up', 'en', 'whatsapp', null,
   '🌄 Minga: your trip to {expedition_title} on {salida_starts_at} is confirmed. We will message you the day before with details.'),

  ('expedition.completed', 'es', 'email', '¿Cómo te fue en {expedition_title}?',
   'Esperamos que hayas disfrutado la expedición. Acumulaste {distance_km} km y {elevation_m} m de desnivel. ¡Cuéntanos en una reseña corta cuando puedas!'),
  ('expedition.completed', 'en', 'email', 'How was {expedition_title}?',
   'Hope you loved the trip. You logged {distance_km} km and {elevation_m} m of elevation. Leave a quick review when you can!'),

  ('review.reminder', 'es', 'email', 'Tu reseña de {expedition_title}',
   'Hace unos días terminaste {expedition_title}. ¿Nos compartes una reseña corta para ayudar a otros viajeros?'),
  ('review.reminder', 'en', 'email', 'Review {expedition_title}',
   'You finished {expedition_title} a few days ago. Mind leaving a quick review to help future travelers?'),

  ('tier.leveled_up', 'es', 'email', '¡Subiste a {new_tier}!',
   '¡Felicitaciones! Acumulaste {total_distance_km} km y subiste de categoría a {new_tier}.'),
  ('tier.leveled_up', 'en', 'email', 'You reached {new_tier}!',
   'Congrats! You hit {total_distance_km} km and leveled up to {new_tier}.')
on conflict (event_key, locale, channel) do nothing;
