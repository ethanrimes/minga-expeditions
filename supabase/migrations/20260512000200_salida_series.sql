-- ============================================================================
-- Admin restructure · Phase 2 · Salida series (recurrence)
-- ----------------------------------------------------------------------------
-- The admin "Dates" page needs to create a series of salidas in one shot
-- ("repeat every 2 weeks until 2026-12-31") and then let the admin edit a
-- single occurrence vs. the whole series.
--
-- We materialize every occurrence as a real `expedition_salidas` row (so
-- joins to orders/participations stay one-to-one) and link them via
-- `series_id`. A per-row `overrides_series` flag marks instances the admin
-- has hand-edited so bulk "edit whole series" operations can skip them
-- without clobbering local changes.
-- ============================================================================

do $$ begin
  if not exists (select 1 from pg_type where typname = 'salida_frequency') then
    create type public.salida_frequency as enum ('daily','weekly','monthly');
  end if;
end $$;

create table if not exists public.salida_series (
  id uuid primary key default gen_random_uuid(),
  expedition_id uuid not null references public.expeditions(id) on delete cascade,
  provider_id uuid references public.providers(id) on delete set null,

  -- Recurrence definition. `until` is inclusive; null means open-ended (we
  -- still cap materialization at the series_max_occurrences app-side guard).
  frequency public.salida_frequency not null,
  interval_count integer not null default 1 check (interval_count between 1 and 365),
  by_weekday smallint[] not null default '{}'::smallint[],  -- 0=Sun..6=Sat for weekly
  series_until date,

  -- Shared per-occurrence defaults — copied onto each generated salida at
  -- materialization time, then editable per row.
  starts_at timestamptz not null,           -- first occurrence start
  ends_at timestamptz,                      -- first occurrence end
  timezone text not null default 'America/Bogota',
  capacity integer check (capacity is null or capacity > 0),
  price_cents integer check (price_cents is null or price_cents >= 0),
  currency text,
  notes text,
  is_published boolean not null default true,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint salida_series_window_valid check (ends_at is null or ends_at >= starts_at),
  constraint salida_series_until_valid check (series_until is null or series_until >= starts_at::date),
  constraint salida_series_weekday_values check (
    coalesce(array_length(by_weekday, 1), 0) = 0
    or (0 <= all(by_weekday) and 6 >= all(by_weekday))
  )
);

create index if not exists salida_series_expedition_idx
  on public.salida_series (expedition_id);
create index if not exists salida_series_provider_idx
  on public.salida_series (provider_id) where provider_id is not null;

create trigger salida_series_touch
  before update on public.salida_series
  for each row execute function public.touch_updated_at();

-- ---------- RLS ------------------------------------------------------------
alter table public.salida_series enable row level security;

drop policy if exists "salida series readable when parent published" on public.salida_series;
create policy "salida series readable when parent published"
  on public.salida_series for select
  using (
    is_published = true
    and exists (
      select 1 from public.expeditions e
      where e.id = salida_series.expedition_id
        and (e.is_published = true or e.author_id = auth.uid())
    )
  );

drop policy if exists "authors manage own salida series" on public.salida_series;
create policy "authors manage own salida series"
  on public.salida_series for all
  using (
    exists (
      select 1 from public.expeditions e
      where e.id = salida_series.expedition_id and e.author_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.expeditions e
      where e.id = salida_series.expedition_id and e.author_id = auth.uid()
    )
  );

drop policy if exists "admins manage all salida series" on public.salida_series;
create policy "admins manage all salida series"
  on public.salida_series for all
  using (public.is_admin()) with check (public.is_admin());

-- ---------- per-salida series linkage --------------------------------------
alter table public.expedition_salidas
  add column if not exists series_id uuid references public.salida_series(id) on delete set null,
  -- Set to true when an admin hand-edits a generated occurrence. Bulk
  -- "edit whole series" operations should skip these unless force-applied.
  add column if not exists overrides_series boolean not null default false;

create index if not exists salidas_series_idx
  on public.expedition_salidas (series_id) where series_id is not null;
