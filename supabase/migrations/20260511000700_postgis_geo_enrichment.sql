-- PostGIS-backed geo enrichment for activities.
--
-- Adds seven reference layers (point-in-polygon sources) and a resolve_geo(lng,lat)
-- RPC that returns all matching metadata in one query. A trigger on activities
-- auto-fills the geo column when start_lat/start_lng are set; a companion
-- trigger on activity_tracks backfills start_lat/start_lng from the first track.
--
-- Reference layers are loaded by scripts/geo/load.mjs from raw files in
-- data/geo/ (see data/geo source notes in scripts/geo/load.mjs). The migration
-- creates the schema; the loader populates it. Empty tables are harmless —
-- resolve_geo() simply returns nulls for missing layers.

create extension if not exists postgis;

-- ---------- reference layers ----------------------------------------------

create table if not exists public.geo_departamentos (
  divipola text primary key,
  nombre text not null,
  geom geography(multipolygon, 4326) not null
);
create index if not exists geo_departamentos_geom_idx on public.geo_departamentos using gist (geom);

create table if not exists public.geo_municipios (
  divipola text primary key,
  divipola_dpto text not null,
  nombre text not null,
  geom geography(multipolygon, 4326) not null
);
create index if not exists geo_municipios_geom_idx on public.geo_municipios using gist (geom);
create index if not exists geo_municipios_dpto_idx on public.geo_municipios (divipola_dpto);

create table if not exists public.geo_veredas (
  codigo text primary key,
  divipola_mpio text,
  nombre text not null,
  geom geography(multipolygon, 4326) not null
);
create index if not exists geo_veredas_geom_idx on public.geo_veredas using gist (geom);
create index if not exists geo_veredas_mpio_idx on public.geo_veredas (divipola_mpio);

create table if not exists public.geo_biomas (
  id bigserial primary key,
  bioma text,
  ecosistema text,
  tipo_bioma text,
  vegetacion text,
  codigo text,
  geom geography(multipolygon, 4326) not null
);
create index if not exists geo_biomas_geom_idx on public.geo_biomas using gist (geom);

create table if not exists public.geo_areas_protegidas (
  runap_id text primary key,
  nombre text not null,
  categoria text,
  organizacion text,
  geom geography(multipolygon, 4326) not null
);
create index if not exists geo_areas_protegidas_geom_idx on public.geo_areas_protegidas using gist (geom);

create table if not exists public.geo_paramos (
  id bigserial primary key,
  codigo text,
  nombre text,
  area_ha numeric,
  geom geography(multipolygon, 4326) not null
);
create index if not exists geo_paramos_geom_idx on public.geo_paramos using gist (geom);

-- Glaciers ship as a multi-year time series (1850 + 2016). Activity enrichment
-- should hit the most-recent year only — see resolve_geo().
create table if not exists public.geo_glaciares (
  id bigserial primary key,
  nombre text not null,
  ano integer not null,
  geom geography(multipolygon, 4326) not null
);
create index if not exists geo_glaciares_geom_idx on public.geo_glaciares using gist (geom);
create index if not exists geo_glaciares_ano_idx on public.geo_glaciares (ano desc);

-- ---------- RLS: public read on reference data ----------------------------

alter table public.geo_departamentos    enable row level security;
alter table public.geo_municipios       enable row level security;
alter table public.geo_veredas          enable row level security;
alter table public.geo_biomas           enable row level security;
alter table public.geo_areas_protegidas enable row level security;
alter table public.geo_paramos          enable row level security;
alter table public.geo_glaciares        enable row level security;

do $$
declare
  t text;
begin
  foreach t in array array[
    'geo_departamentos','geo_municipios','geo_veredas',
    'geo_biomas','geo_areas_protegidas','geo_paramos','geo_glaciares'
  ] loop
    execute format('drop policy if exists %I on public.%I', t || '_read', t);
    execute format(
      'create policy %I on public.%I for select using (true)',
      t || '_read', t
    );
  end loop;
end$$;

-- ---------- resolver -------------------------------------------------------

create or replace function public.resolve_geo(lng double precision, lat double precision)
returns jsonb
language sql
stable
parallel safe
as $$
  with pt as (
    select st_setsrid(st_makepoint(lng, lat), 4326)::geography as g
  )
  select jsonb_strip_nulls(jsonb_build_object(
    'departamento', (
      select to_jsonb(x) from (
        select d.divipola, d.nombre
        from public.geo_departamentos d, pt
        where st_intersects(d.geom, pt.g)
        limit 1
      ) x
    ),
    'municipio', (
      select to_jsonb(x) from (
        select m.divipola, m.divipola_dpto, m.nombre
        from public.geo_municipios m, pt
        where st_intersects(m.geom, pt.g)
        limit 1
      ) x
    ),
    'vereda', (
      select to_jsonb(x) from (
        select v.codigo, v.divipola_mpio, v.nombre
        from public.geo_veredas v, pt
        where st_intersects(v.geom, pt.g)
        limit 1
      ) x
    ),
    'bioma', (
      select to_jsonb(x) from (
        select b.bioma, b.ecosistema, b.tipo_bioma, b.codigo
        from public.geo_biomas b, pt
        where st_intersects(b.geom, pt.g)
        limit 1
      ) x
    ),
    'area_protegida', (
      select to_jsonb(x) from (
        select a.runap_id, a.nombre, a.categoria, a.organizacion
        from public.geo_areas_protegidas a, pt
        where st_intersects(a.geom, pt.g)
        limit 1
      ) x
    ),
    'paramo', (
      select to_jsonb(x) from (
        select p.codigo, p.nombre
        from public.geo_paramos p, pt
        where st_intersects(p.geom, pt.g)
        limit 1
      ) x
    ),
    'glaciar', (
      -- Multi-year time series: pick the most-recent polygon that contains the point.
      select to_jsonb(x) from (
        select g.nombre, g.ano
        from public.geo_glaciares g, pt
        where st_intersects(g.geom, pt.g)
        order by g.ano desc
        limit 1
      ) x
    )
  ));
$$;

grant execute on function public.resolve_geo(double precision, double precision)
  to anon, authenticated, service_role;

-- ---------- activity enrichment -------------------------------------------

alter table public.activities
  add column if not exists start_lat double precision,
  add column if not exists start_lng double precision,
  add column if not exists geo jsonb;

-- Fire when an activity gains a start point but hasn't been resolved yet.
create or replace function public.activities_fill_geo()
returns trigger
language plpgsql
as $$
begin
  if new.start_lat is not null
     and new.start_lng is not null
     and new.geo is null
  then
    new.geo := public.resolve_geo(new.start_lng, new.start_lat);
  end if;
  return new;
end;
$$;

drop trigger if exists activities_fill_geo_trg on public.activities;
create trigger activities_fill_geo_trg
  before insert or update of start_lat, start_lng on public.activities
  for each row execute function public.activities_fill_geo();

-- When the first track point arrives, backfill the activity's start coords.
-- WHERE start_lat is null makes this idempotent under concurrent inserts.
create or replace function public.activity_tracks_backfill_start()
returns trigger
language plpgsql
as $$
begin
  update public.activities
    set start_lat = new.lat,
        start_lng = new.lng
    where id = new.activity_id
      and start_lat is null;
  return null;
end;
$$;

drop trigger if exists activity_tracks_backfill_start_trg on public.activity_tracks;
create trigger activity_tracks_backfill_start_trg
  after insert on public.activity_tracks
  for each row execute function public.activity_tracks_backfill_start();

-- ---------- MVT tile function ---------------------------------------------
-- Returns a Mapbox Vector Tile for one layer + (z, x, y). Called by the
-- geo-tile Edge Function. Heavy layers gate themselves via minimum zooms.

create or replace function public.geo_tile(
  p_layer text,
  p_z int,
  p_x int,
  p_y int
) returns bytea
language plpgsql
stable
parallel safe
as $$
declare
  v_bbox3857 geometry;
  v_bbox4326 geometry;
  v_mvt bytea;
begin
  if p_z < 0 or p_z > 22 then return null; end if;
  v_bbox3857 := st_tileenvelope(p_z, p_x, p_y);
  v_bbox4326 := st_transform(v_bbox3857, 4326);

  if p_layer = 'departamentos' then
    select st_asmvt(t.*, 'departamentos', 4096, 'geom')
      into v_mvt
      from (
        select divipola, nombre,
               st_asmvtgeom(st_transform(geom::geometry, 3857), v_bbox3857, 4096, 64, true) as geom
        from public.geo_departamentos
        where geom && v_bbox4326::geography
      ) t
      where t.geom is not null;

  elsif p_layer = 'municipios' then
    if p_z < 6 then return null; end if;
    select st_asmvt(t.*, 'municipios', 4096, 'geom')
      into v_mvt
      from (
        select divipola, divipola_dpto, nombre,
               st_asmvtgeom(st_transform(geom::geometry, 3857), v_bbox3857, 4096, 64, true) as geom
        from public.geo_municipios
        where geom && v_bbox4326::geography
      ) t
      where t.geom is not null;

  elsif p_layer = 'veredas' then
    if p_z < 11 then return null; end if;
    select st_asmvt(t.*, 'veredas', 4096, 'geom')
      into v_mvt
      from (
        select codigo, divipola_mpio, nombre,
               st_asmvtgeom(st_transform(geom::geometry, 3857), v_bbox3857, 4096, 64, true) as geom
        from public.geo_veredas
        where geom && v_bbox4326::geography
      ) t
      where t.geom is not null;

  elsif p_layer = 'biomas' then
    if p_z < 5 then return null; end if;
    select st_asmvt(t.*, 'biomas', 4096, 'geom')
      into v_mvt
      from (
        select id, bioma, ecosistema, tipo_bioma,
               st_asmvtgeom(st_transform(geom::geometry, 3857), v_bbox3857, 4096, 64, true) as geom
        from public.geo_biomas
        where geom && v_bbox4326::geography
      ) t
      where t.geom is not null;

  elsif p_layer = 'areas_protegidas' then
    select st_asmvt(t.*, 'areas_protegidas', 4096, 'geom')
      into v_mvt
      from (
        select runap_id, nombre, categoria, organizacion,
               st_asmvtgeom(st_transform(geom::geometry, 3857), v_bbox3857, 4096, 64, true) as geom
        from public.geo_areas_protegidas
        where geom && v_bbox4326::geography
      ) t
      where t.geom is not null;

  elsif p_layer = 'paramos' then
    select st_asmvt(t.*, 'paramos', 4096, 'geom')
      into v_mvt
      from (
        select id, codigo, nombre,
               st_asmvtgeom(st_transform(geom::geometry, 3857), v_bbox3857, 4096, 64, true) as geom
        from public.geo_paramos
        where geom && v_bbox4326::geography
      ) t
      where t.geom is not null;

  elsif p_layer = 'glaciares' then
    -- Show only the most-recent polygon per named glacier (different glaciers
    -- have different latest survey years — Santa Marta 2017, others 2016).
    select st_asmvt(t.*, 'glaciares', 4096, 'geom')
      into v_mvt
      from (
        select l.id, l.nombre, l.ano,
               st_asmvtgeom(st_transform(l.geom::geometry, 3857), v_bbox3857, 4096, 64, true) as geom
        from (
          select distinct on (nombre) id, nombre, ano, geom
          from public.geo_glaciares
          order by nombre, ano desc
        ) l
        where l.geom && v_bbox4326::geography
      ) t
      where t.geom is not null;

  else
    return null;
  end if;

  return coalesce(v_mvt, ''::bytea);
end;
$$;

grant execute on function public.geo_tile(text, int, int, int)
  to anon, authenticated, service_role;
