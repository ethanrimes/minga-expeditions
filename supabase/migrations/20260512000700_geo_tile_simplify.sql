-- Tile-resolution simplification for the public.geo_tile() MVT function.
--
-- Background: at low zooms the unmodified polygon geometries from
-- geo_areas_protegidas and geo_paramos carry tens of thousands of vertices
-- per row. ST_AsMVTGeom still has to walk every vertex even though most
-- collapse to a single pixel at the target tile, which pushes p99 tile
-- response time past the Edge Function timeout (the 500s currently seen
-- on tiles like areas_protegidas/6/18/30 and /4/4/7).
--
-- Fix: simplify the source geometry to roughly half a tile pixel *before*
-- ST_AsMVTGeom. The tolerance is derived from the tile's Web Mercator
-- envelope in metres divided by the 4096-unit extent. We use
-- ST_SimplifyPreserveTopology so adjacent polygon borders (PNN, páramos)
-- still stitch together. At z>=12 the tolerance becomes < 1 m which is a
-- no-op, so detail is preserved when you zoom in.
--
-- Pure optimisation: same rows, same source-layer names, same payload
-- shape. Clients (web/mobile-web/mobile) do not need changes.

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
  v_tol double precision;   -- simplification tolerance in metres (Web Mercator units)
  v_mvt bytea;
begin
  if p_z < 0 or p_z > 22 then return null; end if;
  v_bbox3857 := st_tileenvelope(p_z, p_x, p_y);
  v_bbox4326 := st_transform(v_bbox3857, 4326);
  -- Half a tile pixel: bbox width / 4096 / 2.
  v_tol := (st_xmax(v_bbox3857) - st_xmin(v_bbox3857)) / 4096.0 / 2.0;

  if p_layer = 'departamentos' then
    select st_asmvt(t.*, 'departamentos', 4096, 'geom')
      into v_mvt
      from (
        select divipola, nombre,
               st_asmvtgeom(
                 st_simplifypreservetopology(st_transform(geom::geometry, 3857), v_tol),
                 v_bbox3857, 4096, 64, true
               ) as geom
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
               st_asmvtgeom(
                 st_simplifypreservetopology(st_transform(geom::geometry, 3857), v_tol),
                 v_bbox3857, 4096, 64, true
               ) as geom
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
               st_asmvtgeom(
                 st_simplifypreservetopology(st_transform(geom::geometry, 3857), v_tol),
                 v_bbox3857, 4096, 64, true
               ) as geom
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
               st_asmvtgeom(
                 st_simplifypreservetopology(st_transform(geom::geometry, 3857), v_tol),
                 v_bbox3857, 4096, 64, true
               ) as geom
        from public.geo_biomas
        where geom && v_bbox4326::geography
      ) t
      where t.geom is not null;

  elsif p_layer = 'areas_protegidas' then
    select st_asmvt(t.*, 'areas_protegidas', 4096, 'geom')
      into v_mvt
      from (
        select runap_id, nombre, categoria, organizacion,
               st_asmvtgeom(
                 st_simplifypreservetopology(st_transform(geom::geometry, 3857), v_tol),
                 v_bbox3857, 4096, 64, true
               ) as geom
        from public.geo_areas_protegidas
        where geom && v_bbox4326::geography
      ) t
      where t.geom is not null;

  elsif p_layer = 'paramos' then
    select st_asmvt(t.*, 'paramos', 4096, 'geom')
      into v_mvt
      from (
        select id, codigo, nombre,
               st_asmvtgeom(
                 st_simplifypreservetopology(st_transform(geom::geometry, 3857), v_tol),
                 v_bbox3857, 4096, 64, true
               ) as geom
        from public.geo_paramos
        where geom && v_bbox4326::geography
      ) t
      where t.geom is not null;

  elsif p_layer = 'glaciares' then
    -- Show only the most-recent polygon per named glacier.
    select st_asmvt(t.*, 'glaciares', 4096, 'geom')
      into v_mvt
      from (
        select l.id, l.nombre, l.ano,
               st_asmvtgeom(
                 st_simplifypreservetopology(st_transform(l.geom::geometry, 3857), v_tol),
                 v_bbox3857, 4096, 64, true
               ) as geom
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
