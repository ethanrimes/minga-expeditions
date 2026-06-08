#!/usr/bin/env node
// ---------------------------------------------------------------------------
// select-backend.mjs — flip the whole monorepo between backend targets
// (Supabase managed today, self-hosted Supabase-on-Azure tomorrow) with ONE
// command, so prod can later point at a different subscription/region without
// touching app code.
//
//   node scripts/select-backend.mjs            # apply current MINGA_BACKEND (default: supabase)
//   node scripts/select-backend.mjs azure      # switch to the Azure target
//   node scripts/select-backend.mjs supabase   # switch back (rollback)
//   node scripts/select-backend.mjs --status   # print active target, keys masked
//
// How it works
// ------------
// The root `.env` holds two *source* blocks that never get overwritten:
//   BACKEND_SUPABASE_URL / _ANON_KEY / _SERVICE_ROLE_KEY / _DB_URL
//   BACKEND_AZURE_URL    / _ANON_KEY / _SERVICE_ROLE_KEY / _DB_URL
// Selecting a backend copies that block into the *active* vars every app reads
// (SUPABASE_*, plus the framework-prefixed mirrors VITE_/EXPO_PUBLIC_/NEXT_PUBLIC_)
// and writes the per-app env files. Both REST (/rest/v1) and Edge Functions
// (/functions/v1) live under the single base URL, so a URL+key swap is enough.
//
// First run convenience: if BACKEND_SUPABASE_* is missing it is seeded from the
// existing active SUPABASE_* values, so your current working setup is captured
// as the "supabase" source automatically.
// ---------------------------------------------------------------------------

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const ROOT_ENV = join(ROOT, '.env');

const KNOWN_BACKENDS = ['supabase', 'azure'];

// --- tiny dotenv parser/serializer that preserves comments + unmanaged keys ---
function parseEnv(text) {
  const lines = text.split(/\r?\n/);
  const map = new Map(); // key -> { value, lineIdx }
  lines.forEach((line, idx) => {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=(.*)$/);
    if (m && !line.trimStart().startsWith('#')) map.set(m[1], { value: m[2], lineIdx: idx });
  });
  return { lines, map };
}

function upsert(state, key, value) {
  const existing = state.map.get(key);
  const serialized = `${key}=${value ?? ''}`;
  if (existing) {
    state.lines[existing.lineIdx] = serialized;
    existing.value = value ?? '';
  } else {
    state.lines.push(serialized);
    state.map.set(key, { value: value ?? '', lineIdx: state.lines.length - 1 });
  }
}

function get(state, key) {
  const e = state.map.get(key);
  return e ? e.value : undefined;
}

function loadState(path) {
  const text = existsSync(path) ? readFileSync(path, 'utf8') : '';
  return parseEnv(text);
}

function save(path, state) {
  mkdirSync(dirname(path), { recursive: true });
  let out = state.lines.join('\n');
  if (!out.endsWith('\n')) out += '\n';
  writeFileSync(path, out, 'utf8');
}

function mask(v) {
  if (!v) return '(empty)';
  if (v.length <= 10) return v[0] + '***';
  return v.slice(0, 6) + '…' + v.slice(-4);
}

// --- main -------------------------------------------------------------------
const arg = process.argv[2];
const statusOnly = arg === '--status' || arg === '-s';
const root = loadState(ROOT_ENV);

if (!existsSync(ROOT_ENV)) {
  console.error('No root .env found. Copy .env.example to .env first.');
  process.exit(1);
}

// Seed BACKEND_SUPABASE_* from the existing active SUPABASE_* on first run.
const seedPairs = [
  ['BACKEND_SUPABASE_URL', 'SUPABASE_URL'],
  ['BACKEND_SUPABASE_ANON_KEY', 'SUPABASE_ANON_KEY'],
  ['BACKEND_SUPABASE_SERVICE_ROLE_KEY', 'SUPABASE_SERVICE_ROLE_KEY'],
  ['BACKEND_SUPABASE_DB_URL', 'SUPABASE_DB_URL'],
];
let seeded = false;
for (const [backendKey, activeKey] of seedPairs) {
  if (get(root, backendKey) === undefined && get(root, activeKey) !== undefined) {
    upsert(root, backendKey, get(root, activeKey));
    seeded = true;
  }
}

const current = get(root, 'MINGA_BACKEND') || 'supabase';

if (statusOnly) {
  const url = get(root, 'SUPABASE_URL');
  console.log(`MINGA_BACKEND = ${current}`);
  console.log(`  active SUPABASE_URL              = ${url || '(unset)'}`);
  console.log(`  active SUPABASE_ANON_KEY         = ${mask(get(root, 'SUPABASE_ANON_KEY'))}`);
  console.log(`  active SUPABASE_SERVICE_ROLE_KEY = ${mask(get(root, 'SUPABASE_SERVICE_ROLE_KEY'))}`);
  for (const b of KNOWN_BACKENDS) {
    const u = get(root, `BACKEND_${b.toUpperCase()}_URL`);
    console.log(`  source[${b}] URL = ${u || '(unset)'}`);
  }
  if (seeded) save(ROOT_ENV, root); // persist the seeded supabase source
  process.exit(0);
}

const target = (arg || current || 'supabase').toLowerCase();
if (!KNOWN_BACKENDS.includes(target)) {
  console.error(`Unknown backend "${target}". Known: ${KNOWN_BACKENDS.join(', ')}`);
  process.exit(1);
}

const P = `BACKEND_${target.toUpperCase()}_`;
const url = get(root, `${P}URL`);
const anon = get(root, `${P}ANON_KEY`);
const service = get(root, `${P}SERVICE_ROLE_KEY`) ?? '';
const dbUrl = get(root, `${P}DB_URL`) ?? '';

if (!url || !anon) {
  console.error(
    `Backend "${target}" is missing ${P}URL and/or ${P}ANON_KEY in .env.\n` +
      `Fill those in (see .env.example) before switching.`,
  );
  process.exit(1);
}

// 1) Active vars in the root .env (consumed by scripts, functions, admin server).
upsert(root, 'MINGA_BACKEND', target);
upsert(root, 'SUPABASE_URL', url);
upsert(root, 'SUPABASE_ANON_KEY', anon);
upsert(root, 'SUPABASE_SERVICE_ROLE_KEY', service);
upsert(root, 'SUPABASE_DB_URL', dbUrl);
upsert(root, 'VITE_SUPABASE_URL', url);
upsert(root, 'VITE_SUPABASE_ANON_KEY', anon);
upsert(root, 'EXPO_PUBLIC_SUPABASE_URL', url);
upsert(root, 'EXPO_PUBLIC_SUPABASE_ANON_KEY', anon);
upsert(root, 'NEXT_PUBLIC_SUPABASE_URL', url);
upsert(root, 'NEXT_PUBLIC_SUPABASE_ANON_KEY', anon);
save(ROOT_ENV, root);

// 2) Per-app env files (only the keys each framework actually inlines).
const appTargets = [
  { path: join(ROOT, 'apps', 'web', '.env.local'), keys: { VITE_SUPABASE_URL: url, VITE_SUPABASE_ANON_KEY: anon } },
  { path: join(ROOT, 'apps', 'mobile-web', '.env.local'), keys: { VITE_SUPABASE_URL: url, VITE_SUPABASE_ANON_KEY: anon } },
  { path: join(ROOT, 'apps', 'mobile', '.env'), keys: { EXPO_PUBLIC_SUPABASE_URL: url, EXPO_PUBLIC_SUPABASE_ANON_KEY: anon } },
  {
    path: join(ROOT, 'apps', 'admin', '.env.local'),
    keys: {
      NEXT_PUBLIC_SUPABASE_URL: url,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: anon,
      SUPABASE_SERVICE_ROLE_KEY: service,
    },
  },
];

for (const t of appTargets) {
  const st = loadState(t.path);
  for (const [k, v] of Object.entries(t.keys)) upsert(st, k, v);
  save(t.path, st);
}

console.log(`✅ Backend switched to "${target}"`);
console.log(`   base URL: ${url}`);
console.log(`   anon key: ${mask(anon)}`);
console.log('   updated: root .env + apps/{web,mobile-web,mobile,admin} env files');
console.log('   NOTE: restart dev servers (Vite/Expo/Next read env at startup).');
