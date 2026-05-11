-- ============================================================================
-- Phase 4 · Expedition salidas (scheduled departures) + order linkage
-- ----------------------------------------------------------------------------
-- An `expedition` row is a reusable template. A `salida` is a dated instance
-- of that template — capacity, optional price override, publish state. Orders
-- gain a nullable `salida_id` FK so each purchase maps to a specific
-- departure; existing orders keep `salida_id = NULL` and remain valid.
-- ============================================================================

-- ---------- expedition_salidas ---------------------------------------------
create table if not exists public.expedition_salidas (
  id uuid primary key default gen_random_uuid(),
  expedition_id uuid not null references public.expeditions(id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz,
  timezone text not null default 'America/Bogota',
  capacity integer check (capacity is null or capacity > 0),
  seats_taken integer not null default 0 check (seats_taken >= 0),
  price_cents integer check (price_cents is null or price_cents >= 0),
  currency text,
  notes text,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint salidas_window_valid check (ends_at is null or ends_at >= starts_at)
);

create index if not exists salidas_expedition_idx
  on public.expedition_salidas (expedition_id, starts_at);
create index if not exists salidas_upcoming_idx
  on public.expedition_salidas (starts_at)
  where is_published = true;
create index if not exists salidas_published_starts_idx
  on public.expedition_salidas (is_published, starts_at);

create trigger salidas_touch
  before update on public.expedition_salidas
  for each row execute function public.touch_updated_at();

-- ---------- RLS for salidas -------------------------------------------------
alter table public.expedition_salidas enable row level security;

drop policy if exists "salidas readable when parent published" on public.expedition_salidas;
create policy "salidas readable when parent published"
  on public.expedition_salidas for select
  using (
    is_published = true
    and exists (
      select 1 from public.expeditions e
      where e.id = expedition_salidas.expedition_id
        and (e.is_published = true or e.author_id = auth.uid())
    )
  );

drop policy if exists "authors read own expedition salidas" on public.expedition_salidas;
create policy "authors read own expedition salidas"
  on public.expedition_salidas for select
  using (
    exists (
      select 1 from public.expeditions e
      where e.id = expedition_salidas.expedition_id
        and e.author_id = auth.uid()
    )
  );

drop policy if exists "authors manage own expedition salidas" on public.expedition_salidas;
create policy "authors manage own expedition salidas"
  on public.expedition_salidas for all
  using (
    exists (
      select 1 from public.expeditions e
      where e.id = expedition_salidas.expedition_id
        and e.author_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.expeditions e
      where e.id = expedition_salidas.expedition_id
        and e.author_id = auth.uid()
    )
  );

drop policy if exists "admins manage all salidas" on public.expedition_salidas;
create policy "admins manage all salidas"
  on public.expedition_salidas for all
  using (public.is_admin())
  with check (public.is_admin());

-- ---------- orders.salida_id -----------------------------------------------
alter table public.orders
  add column if not exists salida_id uuid references public.expedition_salidas(id) on delete set null;

create index if not exists orders_salida_idx
  on public.orders (salida_id) where salida_id is not null;
