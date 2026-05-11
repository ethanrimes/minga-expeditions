#!/usr/bin/env node
// Seeds a "completed trip" for a target user so the next time they log in the
// trip-completion modal pops with stats + (optionally) a tier-up banner.
//
// Usage:
//   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
//     node scripts/seed-completed-trip.mjs <user-email>
//
// What it does:
//   1. Looks up the auth user + profile by email.
//   2. Picks (or creates) an expedition + a salida whose ends_at is in the past.
//   3. Inserts a `participations` row with completion_acknowledged_at = NULL
//      and tier_at_signup = 'bronze' (so any tier upgrade post-trip shows the
//      level-up confetti).
//
// Designed to be idempotent: re-running upserts and resets the ack timestamp.

import { createClient } from '@supabase/supabase-js';
import process from 'node:process';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars are required.');
  process.exit(1);
}
const email = process.argv[2];
if (!email) {
  console.error('Usage: seed-completed-trip.mjs <user-email>');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function main() {
  // Resolve auth user by email.
  const { data: authList, error: authErr } = await supabase.auth.admin.listUsers();
  if (authErr) throw authErr;
  const authUser = authList.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
  if (!authUser) throw new Error(`No auth user found for ${email}. Sign up first.`);

  // Ensure a profile exists (the on_auth_user_created trigger usually handles this).
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', authUser.id).maybeSingle();
  if (!profile) throw new Error(`Profile missing for ${email}; sign up flow may have failed.`);

  // Pick the first published expedition; seed already has 10.
  const { data: expedition, error: expErr } = await supabase
    .from('expeditions')
    .select('id, title, currency, price_cents')
    .eq('is_published', true)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();
  if (expErr) throw expErr;
  if (!expedition) throw new Error('No expedition in the database yet — run `supabase db reset`.');

  // Insert (or reuse) a salida that already ended a couple days ago.
  const endedAt = new Date();
  endedAt.setDate(endedAt.getDate() - 2);
  const startedAt = new Date(endedAt);
  startedAt.setDate(startedAt.getDate() - 4);

  const fakeId = `aaaaaaaa-aaaa-aaaa-aaaa-${authUser.id.replace(/[^a-f0-9]/g, '').slice(0, 12).padEnd(12, '0')}`;

  const { data: salida, error: salErr } = await supabase
    .from('expedition_salidas')
    .upsert(
      {
        id: fakeId,
        expedition_id: expedition.id,
        starts_at: startedAt.toISOString(),
        ends_at: endedAt.toISOString(),
        timezone: 'America/Bogota',
        capacity: 10,
        seats_taken: 1,
        is_published: false,
        notes: 'auto-seeded by scripts/seed-completed-trip.mjs',
      },
      { onConflict: 'id' },
    )
    .select('*')
    .single();
  if (salErr) throw salErr;

  // Upsert the participation as bronze-at-signup so the level-up banner fires
  // if the user has progressed past bronze.
  const { error: pErr } = await supabase
    .from('participations')
    .upsert(
      {
        user_id: authUser.id,
        salida_id: salida.id,
        expedition_id: expedition.id,
        tier_at_signup: 'bronze',
        attended_at: endedAt.toISOString(),
        completion_acknowledged_at: null,
        ack_distance_km: 18.4,
        ack_elevation_m: 850,
      },
      { onConflict: 'user_id,salida_id' },
    );
  if (pErr) throw pErr;

  console.log(`Seeded completed trip for ${email}.`);
  console.log(`  expedition: ${expedition.title}`);
  console.log(`  salida    : ${salida.id} (ends_at ${salida.ends_at})`);
  console.log(`  participation will trigger the completion popup on next login.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
