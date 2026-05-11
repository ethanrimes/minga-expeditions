#!/usr/bin/env node
// Idempotent upsert of demo salidas + a few comm-event-type seeds onto the
// remote Supabase project. Used when `psql` isn't on PATH (Windows) and the
// supabase/seed.sql can't be applied directly.
//
// Usage:
//   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/seed-salidas.mjs

import { createClient } from '@supabase/supabase-js';
import process from 'node:process';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.');
  process.exit(1);
}
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// Anchor every salida to now() so they stay fresh across runs.
const now = Date.now();
const daysFromNow = (d, hoursLong = 0) => ({
  starts_at: new Date(now + d * 86400000).toISOString(),
  ends_at: new Date(now + d * 86400000 + hoursLong * 3600000).toISOString(),
});

const rows = [
  { id: '66666666-0000-0000-0000-000000000001', expedition_id: '22222222-0000-0000-0000-000000000001', ...daysFromNow(14, 4 * 24), capacity: 12, seats_taken: 5, notes: 'Wiwa guides confirmed.' },
  { id: '66666666-0000-0000-0000-000000000002', expedition_id: '22222222-0000-0000-0000-000000000001', ...daysFromNow(45, 4 * 24), capacity: 12, seats_taken: 0 },
  { id: '66666666-0000-0000-0000-000000000003', expedition_id: '22222222-0000-0000-0000-000000000001', ...daysFromNow(90, 4 * 24), capacity: 12, seats_taken: 0, price_cents: 160000000, currency: 'COP' },

  { id: '66666666-0000-0000-0000-000000000010', expedition_id: '22222222-0000-0000-0000-000000000002', ...daysFromNow(7, 6), capacity: 20, seats_taken: 3 },
  { id: '66666666-0000-0000-0000-000000000011', expedition_id: '22222222-0000-0000-0000-000000000002', ...daysFromNow(21, 6), capacity: 20, seats_taken: 0 },
  { id: '66666666-0000-0000-0000-000000000012', expedition_id: '22222222-0000-0000-0000-000000000002', ...daysFromNow(35, 6), capacity: 20, seats_taken: 0 },

  { id: '66666666-0000-0000-0000-000000000020', expedition_id: '22222222-0000-0000-0000-000000000003', ...daysFromNow(10, 24), capacity: 16, seats_taken: 8 },
  { id: '66666666-0000-0000-0000-000000000021', expedition_id: '22222222-0000-0000-0000-000000000003', ...daysFromNow(24, 24), capacity: 16, seats_taken: 2 },

  { id: '66666666-0000-0000-0000-000000000030', expedition_id: '22222222-0000-0000-0000-000000000004', ...daysFromNow(17, 10), capacity: 8, seats_taken: 1, notes: 'Group ride with support van.' },
  { id: '66666666-0000-0000-0000-000000000031', expedition_id: '22222222-0000-0000-0000-000000000004', ...daysFromNow(58, 10), capacity: 8, seats_taken: 0 },

  { id: '66666666-0000-0000-0000-000000000040', expedition_id: '22222222-0000-0000-0000-000000000005', ...daysFromNow(28, 48), capacity: 6, seats_taken: 2, notes: 'Weather window contingency built in.' },

  { id: '66666666-0000-0000-0000-000000000050', expedition_id: '22222222-0000-0000-0000-000000000006', ...daysFromNow(40, 72), capacity: 10, seats_taken: 4 },
  { id: '66666666-0000-0000-0000-000000000051', expedition_id: '22222222-0000-0000-0000-000000000006', ...daysFromNow(70, 72), capacity: 10, seats_taken: 0 },

  { id: '66666666-0000-0000-0000-000000000060', expedition_id: '22222222-0000-0000-0000-000000000007', ...daysFromNow(12, 5), capacity: null, seats_taken: 0 },
  { id: '66666666-0000-0000-0000-000000000061', expedition_id: '22222222-0000-0000-0000-000000000007', ...daysFromNow(26, 5), capacity: null, seats_taken: 0 },

  { id: '66666666-0000-0000-0000-000000000070', expedition_id: '22222222-0000-0000-0000-000000000008', ...daysFromNow(20, 48), capacity: 14, seats_taken: 6 },
  { id: '66666666-0000-0000-0000-000000000071', expedition_id: '22222222-0000-0000-0000-000000000008', ...daysFromNow(55, 48), capacity: 14, seats_taken: 1 },

  { id: '66666666-0000-0000-0000-000000000080', expedition_id: '22222222-0000-0000-0000-000000000009', ...daysFromNow(6, 4), capacity: null, seats_taken: 0, notes: 'Pre-dawn meet at Chingaza gate.' },
  { id: '66666666-0000-0000-0000-000000000081', expedition_id: '22222222-0000-0000-0000-000000000009', ...daysFromNow(20, 4), capacity: null, seats_taken: 0 },

  { id: '66666666-0000-0000-0000-000000000090', expedition_id: '22222222-0000-0000-0000-000000000010', ...daysFromNow(3, 4), capacity: 12, seats_taken: 9 },
  { id: '66666666-0000-0000-0000-000000000091', expedition_id: '22222222-0000-0000-0000-000000000010', ...daysFromNow(15, 4), capacity: 12, seats_taken: 0 },
].map((r) => ({
  is_published: true,
  timezone: 'America/Bogota',
  price_cents: r.price_cents ?? null,
  currency: r.currency ?? null,
  notes: r.notes ?? null,
  ...r,
}));

async function main() {
  const { error } = await supabase
    .from('expedition_salidas')
    .upsert(rows, { onConflict: 'id' });
  if (error) {
    console.error('Salida upsert failed:', error);
    process.exit(1);
  }
  console.log(`Upserted ${rows.length} salidas.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
