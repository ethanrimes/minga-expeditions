#!/usr/bin/env node
// Applies every SQL file passed on argv to the Supabase DB via the session pooler.
// Runs the whole file as a single statement so CREATE FUNCTION dollar-quoted bodies survive.
// Usage: node scripts/run-sql.mjs supabase/migrations/*.sql supabase/seed.sql

import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import pg from 'pg';

const connectionString = process.env.SUPABASE_DB_URL;
if (!connectionString) {
  console.error('✘ Set SUPABASE_DB_URL (session pooler URL with DB password) before running. See .env.example.');
  process.exit(1);
}

const files = process.argv.slice(2);
if (files.length === 0) {
  console.error('usage: node scripts/run-sql.mjs <file.sql> [file.sql ...]');
  process.exit(1);
}

const client = new pg.Client({
  connectionString,
  ssl: { rejectUnauthorized: false },
  application_name: 'minga-run-sql',
  statement_timeout: 120_000,
});

try {
  console.log(`▶ connecting via session pooler…`);
  await client.connect();
  for (const f of files) {
    const abs = resolve(f);
    const sql = await readFile(abs, 'utf8');
    console.log(`▶ applying ${f} (${sql.length} bytes)`);
    try {
      await client.query(sql);
      console.log(`  ✔ done`);
    } catch (err) {
      console.error(`  ✘ failed: ${err.message}`);
      throw err;
    }
  }
} finally {
  await client.end().catch(() => {});
}

console.log('✔ all files applied');
