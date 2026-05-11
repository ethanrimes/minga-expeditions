#!/usr/bin/env node
// One-shot: applies the 6 migrations the Supabase CLI couldn't push because
// the first two are already live but missing from supabase_migrations metadata.
// Wraps each file in its own transaction; if one fails, the others still
// land. Safe to re-run — every file uses `if not exists` or upserts.
//
// Usage:  SUPABASE_DB_URL=... node scripts/apply-missing-migrations.mjs

import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import pg from 'pg';

const __dirname = dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = join(__dirname, '..', 'supabase', 'migrations');

const PENDING = [
  '20260417_000100_activity_feedback.sql',
  '20260417_000200_guest_profiles.sql',
  '20260508_000100_roles_and_categories.sql',
  '20260508_000200_vendor_proposals.sql',
  '20260508_000300_orders_and_guests.sql',
  '20260508_000400_activity_photos_and_tags.sql',
];

const dbUrl = process.env.SUPABASE_DB_URL;
if (!dbUrl) {
  console.error('✘ Set SUPABASE_DB_URL before running.');
  process.exit(1);
}

const client = new pg.Client({ connectionString: dbUrl });
await client.connect();
console.log('▶ connected to remote DB');

for (const file of PENDING) {
  const path = join(MIGRATIONS_DIR, file);
  const sql = await readFile(path, 'utf8');
  process.stdout.write(`▶ ${file} … `);
  try {
    await client.query('begin');
    await client.query(sql);
    await client.query('commit');
    console.log('✓');
  } catch (err) {
    await client.query('rollback').catch(() => {});
    console.log(`✘ ${err.message}`);
  }
}

// Backfill supabase_migrations so future `supabase db push` runs are clean.
console.log('▶ marking all 8 migrations as applied in schema_migrations');
const ALL = [
  '20260416_000100_init_schema.sql',
  '20260416_000200_rls_policies.sql',
  ...PENDING,
];
for (const file of ALL) {
  const version = file.replace(/_/, '').slice(0, 14); // 20260416_000100_x.sql → 20260416000100
  const name = file.replace(/^\d+_\d+_/, '').replace(/\.sql$/, '');
  try {
    await client.query(
      `insert into supabase_migrations.schema_migrations (version, name)
       values ($1, $2)
       on conflict (version) do nothing`,
      [version, name],
    );
    console.log(`  ${version} ${name}`);
  } catch (err) {
    console.log(`  ${version} ${name} — could not record: ${err.message}`);
  }
}

await client.end();
console.log('▶ done');
