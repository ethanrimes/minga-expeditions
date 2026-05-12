#!/usr/bin/env node
// Populates the public.geo_* reference tables created by
// supabase/migrations/20260511000700_postgis_geo_enrichment.sql.
//
// Reads raw files from data/geo/ (gitignored). Each layer truncates + inserts,
// so re-running is the upgrade path when DANE/IDEAM/PNN refresh their data.
//
// Source notes (mirror these in the team handoff doc):
//   - col-admin/*               : HDX COD-AB Colombia (sourced from DANE MGN, vetted 2024-11)
//                                 https://data.humdata.org/dataset/cod-ab-col
//   - crveredas-2024/*          : HDX, DANE 2024 cabildo+resguardo veredas
//   - biomas-etter.geojson      : ArcGIS Online "Biomas de Colombia" layer 3 (Etter ecosistemas)
//   - runap/*                   : storage.googleapis.com/pnn_geodatabase/runap/latest.zip
//   - paramos-complejos.geojson : ArcGIS COMPLEJOS_PARAMOS_GEF (services2.arcgis.com/dyoxMZ2Nct1bN6OL)
//   - glaciares-1850-2016.geojson: IDEAM via Esri Colombia hosted FeatureServer
//
// Usage:
//   SUPABASE_DB_URL=postgres://... node scripts/geo/load.mjs [--only=dpto,muni,vereda,bioma,runap,paramo,glaciar]

import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { open as openShp } from 'shapefile';
import pg from 'pg';

const DB = process.env.SUPABASE_DB_URL;
if (!DB) {
  console.error('✘ SUPABASE_DB_URL is required (session pooler URL with DB password).');
  process.exit(1);
}

const onlyArg = process.argv.find((a) => a.startsWith('--only='));
const ONLY = onlyArg ? new Set(onlyArg.slice('--only='.length).split(',')) : null;
const want = (k) => !ONLY || ONLY.has(k);

const DATA = resolve('data/geo');
const BATCH = 200;

const client = new pg.Client({
  connectionString: DB,
  ssl: { rejectUnauthorized: false },
  application_name: 'minga-geo-load',
  statement_timeout: 0,
});
await client.connect();

// ---- helpers --------------------------------------------------------------

// Multi-row INSERT with one geometry placeholder per row.
// `cols` is the column list ending in 'geom'. `rows` is an array of arrays;
// the last element of each row is the geometry as a GeoJSON object.
// `onConflict` (optional) appends an ON CONFLICT clause for tables where
// the source data has duplicate primary keys (e.g. veredas with multiple
// polygons per codigo — keep the largest).
async function bulkInsert(table, cols, rows, onConflict = '') {
  if (rows.length === 0) return;
  const geomIdx = cols.length - 1;
  const params = [];
  const tuples = rows.map((row) => {
    const pieces = row.map((v, i) => {
      if (i === geomIdx) {
        params.push(typeof v === 'string' ? v : JSON.stringify(v));
        return `st_multi(st_geomfromgeojson($${params.length}))::geography(multipolygon, 4326)`;
      }
      params.push(v);
      return `$${params.length}`;
    });
    return `(${pieces.join(', ')})`;
  });
  const sql = `insert into ${table} (${cols.join(', ')}) values ${tuples.join(', ')} ${onConflict}`;
  await client.query(sql, params);
}

async function loadShapefile(table, cols, shpPath, mapper, { onConflict = '' } = {}) {
  console.log(`▶ loading ${table} from ${shpPath}`);
  await client.query(`truncate ${table} restart identity cascade`);
  const src = await openShp(shpPath, undefined, { encoding: 'utf-8' });
  let batch = [];
  let total = 0;
  while (true) {
    const r = await src.read();
    if (r.done) break;
    const row = mapper(r.value);
    if (!row) continue;
    batch.push(row);
    if (batch.length >= BATCH) {
      await bulkInsert(table, cols, batch, onConflict);
      total += batch.length;
      batch = [];
      if (total % (BATCH * 25) === 0) console.log(`    ${total} rows…`);
    }
  }
  if (batch.length) {
    await bulkInsert(table, cols, batch, onConflict);
    total += batch.length;
  }
  console.log(`  ✔ ${total} features streamed`);
}

async function loadGeoJson(table, cols, jsonPath, mapper, { onConflict = '' } = {}) {
  console.log(`▶ loading ${table} from ${jsonPath}`);
  await client.query(`truncate ${table} restart identity cascade`);
  const raw = await readFile(jsonPath, 'utf8');
  const fc = JSON.parse(raw);
  let batch = [];
  let total = 0;
  for (const feature of fc.features) {
    const row = mapper(feature);
    if (!row) continue;
    batch.push(row);
    if (batch.length >= BATCH) {
      await bulkInsert(table, cols, batch, onConflict);
      total += batch.length;
      batch = [];
    }
  }
  if (batch.length) {
    await bulkInsert(table, cols, batch, onConflict);
    total += batch.length;
  }
  console.log(`  ✔ ${total} features streamed`);
}

// HDX p-codes are 'CO05', 'CO05001' — strip the 'CO' to get DIVIPOLA.
const stripCo = (s) => (s ?? '').replace(/^CO/, '').trim();

// ---- layer loaders --------------------------------------------------------

async function loadDepartamentos() {
  await loadShapefile(
    'public.geo_departamentos',
    ['divipola', 'nombre', 'geom'],
    `${DATA}/col-admin/col_admbnda_adm1_mgn_20200416.shp`,
    (f) => {
      const divipola = stripCo(f.properties.ADM1_PCODE);
      const nombre = f.properties.ADM1_ES;
      if (!divipola || !nombre || !f.geometry) return null;
      return [divipola, nombre, f.geometry];
    },
  );
}

async function loadMunicipios() {
  await loadShapefile(
    'public.geo_municipios',
    ['divipola', 'divipola_dpto', 'nombre', 'geom'],
    `${DATA}/col-admin/col_admbnda_adm2_mgn_20200416.shp`,
    (f) => {
      const divipola = stripCo(f.properties.ADM2_PCODE);
      const divipola_dpto = stripCo(f.properties.ADM1_PCODE);
      const nombre = f.properties.ADM2_ES;
      if (!divipola || !divipola_dpto || !nombre || !f.geometry) return null;
      return [divipola, divipola_dpto, nombre, f.geometry];
    },
  );
}

async function loadVeredas() {
  // The CRVeredas_2024 dataset (Cabildos+Resguardos overlay) has multiple
  // polygons per CODIGO_VER. Strategy: dedupe within each batch by AREA_HA
  // (keeping the largest), and ON CONFLICT WHERE area-bigger across batches.
  // That makes us robust to both within-batch and cross-batch duplicates.
  const table = 'public.geo_veredas';
  const cols = ['codigo', 'divipola_mpio', 'nombre', 'geom'];
  const onConflict = `
    on conflict (codigo) do update set
      geom = excluded.geom,
      nombre = excluded.nombre,
      divipola_mpio = excluded.divipola_mpio
    where st_area(excluded.geom::geometry) > st_area(public.geo_veredas.geom::geometry)
  `;

  console.log(`▶ loading ${table} from ${DATA}/crveredas-2024/shp_CRVeredas_2024.shp`);
  await client.query(`truncate ${table} restart identity cascade`);
  const src = await openShp(`${DATA}/crveredas-2024/shp_CRVeredas_2024.shp`, undefined, { encoding: 'utf-8' });
  // best[codigo] = { row, area } for the current batch
  let best = new Map();
  let total = 0;

  async function flushBatch() {
    const rows = [...best.values()].map((b) => b.row);
    if (rows.length === 0) return;
    await bulkInsert(table, cols, rows, onConflict);
    total += rows.length;
    best = new Map();
    if (total % (BATCH * 5) === 0) console.log(`    ${total} rows…`);
  }

  while (true) {
    const r = await src.read();
    if (r.done) break;
    const f = r.value;
    const codigo = (f.properties.CODIGO_VER ?? '').toString().trim();
    const nombre = (f.properties.NOMBRE_VER ?? '').toString().trim();
    const mpio = (f.properties.DPTOMPIO ?? '').toString().trim();
    const areaHa = Number(f.properties.AREA_HA ?? 0);
    if (!codigo || !nombre || !f.geometry) continue;
    const row = [codigo, mpio || null, nombre, f.geometry];
    const existing = best.get(codigo);
    if (!existing || areaHa > existing.area) best.set(codigo, { row, area: areaHa });
    if (best.size >= BATCH) await flushBatch();
  }
  await flushBatch();
  console.log(`  ✔ ${total} unique-codigo rows inserted`);
}

async function loadBiomas() {
  await loadGeoJson(
    'public.geo_biomas',
    ['bioma', 'ecosistema', 'tipo_bioma', 'vegetacion', 'codigo', 'geom'],
    `${DATA}/biomas-etter.geojson`,
    (f) => {
      const p = f.properties;
      if (!f.geometry) return null;
      return [
        p.BIOMA ?? null,
        p.ECOSISTEMA ?? null,
        p.TIPO_BIOMA ?? null,
        p.VEGETACION ?? null,
        p.CODIGO ?? null,
        f.geometry,
      ];
    },
  );
}

async function loadAreasProtegidas() {
  await loadShapefile(
    'public.geo_areas_protegidas',
    ['runap_id', 'nombre', 'categoria', 'organizacion', 'geom'],
    `${DATA}/runap/runap.shp`,
    (f) => {
      const p = f.properties;
      const runapId = (p.ap_id ?? '').toString().trim();
      const nombre = (p.ap_nombre ?? '').toString().trim();
      if (!runapId || !nombre || !f.geometry) return null;
      return [
        runapId,
        nombre,
        (p.ap_categor ?? null)?.toString().trim() || null,
        (p.organizaci ?? null)?.toString().trim() || null,
        f.geometry,
      ];
    },
  );
}

async function loadParamos() {
  await loadGeoJson(
    'public.geo_paramos',
    ['codigo', 'nombre', 'area_ha', 'geom'],
    `${DATA}/paramos-complejos.geojson`,
    (f) => {
      const p = f.properties;
      if (!f.geometry) return null;
      return [p.COD_CMPLJ ?? null, p.NM_UA ?? null, p.Area_Ha ?? null, f.geometry];
    },
  );
}

async function loadGlaciares() {
  await loadGeoJson(
    'public.geo_glaciares',
    ['nombre', 'ano', 'geom'],
    `${DATA}/glaciares-1850-2016.geojson`,
    (f) => {
      const p = f.properties;
      if (!f.geometry) return null;
      const ano = parseInt(p.descr_ano ?? '0', 10);
      if (!p.nomglaciar || !ano) return null;
      return [p.nomglaciar, ano, f.geometry];
    },
  );
}

// ---- run ------------------------------------------------------------------

const layers = [
  ['dpto', loadDepartamentos],
  ['muni', loadMunicipios],
  ['vereda', loadVeredas],
  ['bioma', loadBiomas],
  ['runap', loadAreasProtegidas],
  ['paramo', loadParamos],
  ['glaciar', loadGlaciares],
];

try {
  for (const [key, fn] of layers) {
    if (!want(key)) {
      console.log(`◇ skip ${key}`);
      continue;
    }
    const t0 = Date.now();
    await fn();
    console.log(`    (${((Date.now() - t0) / 1000).toFixed(1)}s)`);
  }
  console.log('✔ all layers loaded');
} catch (err) {
  console.error('✘', err);
  process.exitCode = 1;
} finally {
  await client.end().catch(() => {});
}
