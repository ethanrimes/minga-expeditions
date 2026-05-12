-- ============================================================================
-- Admin restructure · Phase 6 · On-demand "broadcast" comm templates
-- ----------------------------------------------------------------------------
-- `comm_templates` is reserved for event-driven (automated) messages fired by
-- the system in response to a domain event. Broadcasts are different: the
-- admin composes them once and triggers the send manually (promotions,
-- announcements, new-trip launches, generic reminders). They have no event
-- key, no "active" flag — at send time the admin picks which template to use
-- and what audience to target.
-- ============================================================================

do $$ begin
  if not exists (select 1 from pg_type where typname = 'comm_broadcast_category') then
    create type public.comm_broadcast_category as enum
      ('announcement', 'promotion', 'new_trip', 'reminder', 'other');
  end if;
end $$;

create table if not exists public.comm_broadcast_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(name) between 1 and 120),
  category public.comm_broadcast_category not null default 'announcement',
  channel text not null check (channel in ('email', 'whatsapp')),
  locale text not null check (locale in ('en', 'es')),
  -- Email needs a subject; WhatsApp doesn't (and we treat blanks as null).
  subject text,
  body text not null check (length(body) between 1 and 8000),
  is_archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists comm_broadcasts_category_idx
  on public.comm_broadcast_templates (category, locale, channel)
  where is_archived = false;

create index if not exists comm_broadcasts_recent_idx
  on public.comm_broadcast_templates (created_at desc)
  where is_archived = false;

create trigger comm_broadcasts_touch
  before update on public.comm_broadcast_templates
  for each row execute function public.touch_updated_at();

-- ---------- RLS ------------------------------------------------------------
alter table public.comm_broadcast_templates enable row level security;

drop policy if exists "broadcast templates admin only" on public.comm_broadcast_templates;
create policy "broadcast templates admin only"
  on public.comm_broadcast_templates for all
  using (public.is_admin()) with check (public.is_admin());

-- ---------- seed a couple of starter templates ----------------------------
insert into public.comm_broadcast_templates (id, name, category, channel, locale, subject, body) values
  ('99999999-0000-0000-0000-000000000001', 'Welcome promo · Spanish email', 'promotion', 'email', 'es',
    '20% off tu próxima aventura',
    'Hola {display_name}, este mes lanzamos {n_new_trips} nuevas expediciones. Usa el código MINGA20 para 20% de descuento en tu próxima reserva.'),
  ('99999999-0000-0000-0000-000000000002', 'Welcome promo · English email', 'promotion', 'email', 'en',
    '20% off your next adventure',
    'Hi {display_name}, we launched {n_new_trips} new expeditions this month. Use code MINGA20 for 20% off your next booking.'),
  ('99999999-0000-0000-0000-000000000003', 'New trip launch · WhatsApp ES', 'new_trip', 'whatsapp', 'es',
    null,
    '🌄 Minga: ya está abierta la reserva para {expedition_title}. Sale el {salida_starts_at}. Cupos limitados.')
on conflict (id) do nothing;
