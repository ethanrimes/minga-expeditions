#!/usr/bin/env node
// Smoke-test public.resolve_geo against well-known Colombian coordinates.
// Prints a table; non-zero exit if any "must match" expectation fails.

import pg from 'pg';

const DB = process.env.SUPABASE_DB_URL;
if (!DB) {
  console.error('SUPABASE_DB_URL is required');
  process.exit(1);
}

const SAMPLES = [
  { name: 'Bogotá (Plaza Bolívar)',     lng: -74.0760, lat: 4.5981,  expect: { dpto: 'Bogot', muni: 'Bogot' } },
  { name: 'Medellín (centro)',           lng: -75.5680, lat: 6.2477,  expect: { dpto: 'Antioqu', muni: 'Medell' } },
  { name: 'Cali (centro)',               lng: -76.5325, lat: 3.4516,  expect: { dpto: 'Valle',  muni: 'Cali' } },
  { name: 'Cartagena (centro)',          lng: -75.5444, lat: 10.4236, expect: { dpto: 'Bol',    muni: 'Cartagena' } },
  { name: 'Santa Marta',                 lng: -74.1990, lat: 11.2408, expect: { dpto: 'Magdalena', muni: 'Santa Marta' } },
  { name: 'PNN Tayrona (Cabo San Juan)', lng: -74.0287, lat: 11.3236, expect: { dpto: 'Magdalena', area: /Tayrona/i } },
  { name: 'Páramo de Sumapaz (interior)',lng: -74.1750, lat: 4.0601,  expect: { dpto: /Cundinamarca|Bogot|Huila|Meta/i, paramo: /Sumapaz|Cruz Verde/i } },
  { name: 'Nevado del Ruiz (glaciar)',   lng: -75.3174, lat: 4.8837,  expect: { dpto: /Caldas|Tolima/i, glaciar: /Ruiz/i } },
  { name: 'PNN El Cocuy (glaciar)',      lng: -72.3083, lat: 6.4960,  expect: { dpto: /Boyac|Casanare/i, area: /Cocuy/i, glaciar: /Cocuy/i } },
  { name: 'Sierra Nevada Santa Marta',   lng: -73.7114, lat: 10.8433, expect: { dpto: /Magdalena|Cesar|Guajira/i, glaciar: /Santa Marta/i } },
  { name: 'Amazonas (Leticia)',          lng: -69.9407, lat: -4.2150, expect: { dpto: 'Amazonas', muni: 'Leticia' } },
  { name: 'Selva (Caquetá rural)',       lng: -74.5,    lat: 0.7,     expect: { dpto: 'Caquet' } },
  { name: 'Vereda rural Antioquia',      lng: -75.7000, lat: 6.4500,  expect: { dpto: 'Antioquia', vereda: /./ } },
  { name: 'Pacific Ocean (off Tumaco)',  lng: -79.5,    lat: 1.6,     expect: { allNull: true } },
  { name: 'Caribbean Ocean (off Cart.)', lng: -76.0,    lat: 11.5,    expect: { allNull: true } },
];

const client = new pg.Client({ connectionString: DB, ssl: { rejectUnauthorized: false } });
await client.connect();

let failures = 0;
const rows = [];

for (const s of SAMPLES) {
  const r = await client.query('select public.resolve_geo($1, $2) as geo', [s.lng, s.lat]);
  const geo = r.rows[0].geo ?? {};
  const summary = {
    name: s.name,
    dpto: geo.departamento?.nombre ?? '—',
    muni: geo.municipio?.nombre ?? '—',
    vereda: geo.vereda?.nombre ?? '—',
    bioma: geo.bioma?.bioma ? geo.bioma.bioma.slice(0, 24) : '—',
    area: geo.area_protegida?.nombre ? geo.area_protegida.nombre.slice(0, 30) : '—',
    paramo: geo.paramo?.nombre ?? '—',
    glaciar: geo.glaciar?.nombre ?? '—',
  };
  rows.push(summary);

  const exp = s.expect;
  const check = (label, actual, expected) => {
    if (!expected) return;
    const got = actual ?? '';
    let ok;
    if (expected instanceof RegExp) ok = expected.test(got);
    else ok = got.toLowerCase().includes(expected.toLowerCase());
    if (!ok) {
      failures++;
      console.error(`  ✘ ${s.name} ${label}: expected ${expected}, got "${got}"`);
    }
  };
  if (exp.allNull) {
    const anyMatch = geo.departamento || geo.municipio || geo.vereda || geo.area_protegida || geo.paramo || geo.glaciar;
    if (anyMatch) {
      failures++;
      console.error(`  ✘ ${s.name}: expected all nulls, got ${JSON.stringify(geo)}`);
    }
  } else {
    check('dpto', summary.dpto, exp.dpto);
    check('muni', summary.muni, exp.muni);
    check('vereda', summary.vereda, exp.vereda);
    check('area', summary.area, exp.area);
    check('paramo', summary.paramo, exp.paramo);
    check('glaciar', summary.glaciar, exp.glaciar);
  }
}

await client.end();

console.table(rows);
console.log(failures === 0 ? '✔ all expectations met' : `✘ ${failures} failures`);
process.exitCode = failures === 0 ? 0 : 1;
