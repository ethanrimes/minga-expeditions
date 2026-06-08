#!/usr/bin/env node
// Creates (or refreshes) a demo auth user with pre-populated activities,
// tracks, comments, likes, and ratings. Safe to re-run — everything upserts.
//
// Requires these env vars:
//   SUPABASE_URL                 e.g. https://<your-project>.supabase.co
//   SUPABASE_SERVICE_ROLE_KEY    the sb_secret_... key (never commit this)
//   SUPABASE_DB_URL              session-pooler URL for DDL/DML
//
// Usage:
//   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... SUPABASE_DB_URL=... \
//     node scripts/seed-demo-user.mjs

import pg from 'pg';

const EMAIL = process.env.DEMO_EMAIL ?? 'demo@minga.co';
const PASSWORD = process.env.DEMO_PASSWORD ?? 'MingaDemo2026!';
const DISPLAY_NAME = 'Ethan Demo';
const USERNAME = 'ethan.demo';

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const dbUrl = process.env.SUPABASE_DB_URL;

if (!url || !serviceKey || !dbUrl) {
  console.error('✘ Set SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and SUPABASE_DB_URL.');
  process.exit(1);
}

async function adminFetch(path, init = {}) {
  const res = await fetch(`${url}${path}`, {
    ...init,
    headers: {
      ...(init.headers ?? {}),
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
    },
  });
  const body = await res.text();
  if (!res.ok) throw new Error(`${path} → ${res.status} ${body.slice(0, 300)}`);
  return body ? JSON.parse(body) : null;
}

async function findUserIdByEmail(email) {
  const data = await adminFetch(`/auth/v1/admin/users?email=${encodeURIComponent(email)}`);
  const users = data?.users ?? [];
  return users.find((u) => u.email?.toLowerCase() === email.toLowerCase())?.id ?? null;
}

async function ensureDemoUser() {
  const existing = await findUserIdByEmail(EMAIL);
  if (existing) {
    console.log(`▶ auth user already exists (${EMAIL} → ${existing}), updating password`);
    await adminFetch(`/auth/v1/admin/users/${existing}`, {
      method: 'PUT',
      body: JSON.stringify({
        password: PASSWORD,
        email_confirm: true,
        user_metadata: { display_name: DISPLAY_NAME, username: USERNAME },
      }),
    });
    return existing;
  }
  console.log(`▶ creating auth user ${EMAIL}`);
  const created = await adminFetch('/auth/v1/admin/users', {
    method: 'POST',
    body: JSON.stringify({
      email: EMAIL,
      password: PASSWORD,
      email_confirm: true,
      user_metadata: { display_name: DISPLAY_NAME, username: USERNAME },
    }),
  });
  return created?.id ?? (await findUserIdByEmail(EMAIL));
}

// Generate a ragged, realistic-looking GPS polyline near a center point.
// Returns [{lng, lat, altitude_m, seq, recorded_at}, …].
function makeTrack(centerLng, centerLat, startElev, points, stepMeters, startMs) {
  const meterPerDegLat = 1 / 110574;
  const meterPerDegLng = (lat) => 1 / (111320 * Math.cos((lat * Math.PI) / 180));

  let lng = centerLng;
  let lat = centerLat;
  let elev = startElev;
  const out = [];
  for (let i = 0; i < points; i++) {
    const ang = (i / points) * Math.PI * 2 + Math.sin(i * 0.3) * 0.4;
    const noise = Math.sin(i * 0.7) * 0.4 + (Math.random() - 0.5) * 0.3;
    lat += Math.cos(ang) * stepMeters * meterPerDegLat * (1 + noise * 0.2);
    lng += Math.sin(ang) * stepMeters * meterPerDegLng(lat) * (1 + noise * 0.2);
    elev += (Math.sin(i * 0.5) * 4) + (i < points / 2 ? 1.5 : -1.5);
    out.push({
      lng,
      lat,
      altitude_m: Math.max(0, elev),
      seq: i,
      ts: new Date(startMs + i * 60_000).toISOString(), // one point per minute
    });
  }
  return out;
}

// Pool of seeded expedition ids (see supabase/seed). Minga activities link to one
// of these; independent activities have expedition_id = null.
const EXPEDITION_POOL = Array.from(
  { length: 9 },
  (_, i) => `22222222-0000-0000-0000-00000000000${i + 1}`,
);

// Real-ish Colombian outdoor spots reused across the generated history.
const SPOTS = [
  { title: 'Chingaza páramo sunrise', type: 'run', center: [-73.7536, 4.6872], elev: 3200, dKm: 17.8, gain: 700 },
  { title: 'Valle de Cocora mirador loop', type: 'hike', center: [-75.486, 4.6373], elev: 2400, dKm: 12.7, gain: 660 },
  { title: 'El Peñón de Guatapé + lake', type: 'hike', center: [-75.1597, 6.2328], elev: 1920, dKm: 11.2, gain: 390 },
  { title: 'Monserrate stair push', type: 'hike', center: [-74.0558, 4.6061], elev: 2640, dKm: 3.6, gain: 540 },
  { title: 'Suesca rock approach', type: 'hike', center: [-73.7972, 5.1031], elev: 2580, dKm: 6.1, gain: 220 },
  { title: 'Laguna de Guatavita rim', type: 'hike', center: [-73.7783, 4.9783], elev: 3000, dKm: 7.4, gain: 180 },
  { title: 'Cerros Orientales dawn run', type: 'run', center: [-74.0411, 4.6486], elev: 2680, dKm: 9.2, gain: 300 },
  { title: 'Ciclovía Bogotá long ride', type: 'ride', center: [-74.0721, 4.7110], elev: 2640, dKm: 38.5, gain: 210 },
  { title: 'La Chorrera waterfall', type: 'hike', center: [-73.9869, 4.4214], elev: 2900, dKm: 8.8, gain: 430 },
  { title: 'Nevado del Ruiz acclimatization', type: 'hike', center: [-75.3236, 4.8922], elev: 4050, dKm: 9.5, gain: 520 },
  { title: 'Parque Tayrona — Cabo San Juan', type: 'hike', center: [-74.0306, 11.3097], elev: 30, dKm: 14.3, gain: 260 },
  { title: 'Usaquén tempo run', type: 'run', center: [-74.0309, 4.6951], elev: 2580, dKm: 6.8, gain: 90 },
  { title: 'Parque Simón Bolívar loops', type: 'walk', center: [-74.0925, 4.6585], elev: 2600, dKm: 5.2, gain: 40 },
  { title: 'Sierra Nevada del Cocuy ridge', type: 'hike', center: [-72.3333, 6.4167], elev: 4200, dKm: 13.9, gain: 880 },
];

// Build ~36 activities spread across roughly a year, mixing Minga-linked
// (expedition_id set) and independent (expedition_id null) outings.
function buildDemoActivities() {
  const out = [];
  const count = 36;
  for (let i = 0; i < count; i++) {
    const spot = SPOTS[i % SPOTS.length];
    // ~45% Minga, deterministic so re-runs are stable.
    const isMinga = i % 9 < 4;
    // Vary the distance/elevation a little per outing.
    const jitter = 0.85 + ((i * 37) % 30) / 100; // 0.85..1.14
    const distance_km = Math.round(spot.dKm * jitter * 10) / 10;
    const elevation_gain_m = Math.round(spot.gain * jitter);
    // Rough pace per type to derive a believable duration.
    const kmh = spot.type === 'ride' ? 18 : spot.type === 'run' ? 9 : 4.2;
    const duration_min = Math.max(25, Math.round((distance_km / kmh) * 60));
    out.push({
      id: `aaaa0001-0000-0000-0000-${String(i + 1).padStart(12, '0')}`,
      expedition_id: isMinga ? EXPEDITION_POOL[i % EXPEDITION_POOL.length] : null,
      activity_type: spot.type,
      title: spot.title,
      notes: isMinga ? 'Minga expedition outing.' : 'Solo training session.',
      // Spread from ~12 days ago back to ~358 days ago.
      start_offset_days: 12 + i * 10,
      duration_min,
      center: spot.center,
      start_elev: spot.elev,
      points: Math.min(70, 24 + Math.round(distance_km * 2)),
      step: spot.type === 'ride' ? 600 : 240,
      distance_km,
      elevation_gain_m,
    });
  }
  return out;
}

const DEMO_ACTIVITIES = buildDemoActivities();

async function main() {
  const userId = await ensureDemoUser();
  if (!userId) throw new Error('could not resolve demo user id');
  console.log(`▶ demo user id = ${userId}`);

  const client = new pg.Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
  await client.connect();
  try {
    // Ensure the profile row exists (the on_auth_user_created trigger should have made one).
    await client.query(
      `insert into public.profiles (id, username, display_name, avatar_url, bio, home_country)
       values ($1, $2, $3, $4, $5, $6)
       on conflict (id) do update set
         display_name = excluded.display_name,
         avatar_url   = excluded.avatar_url,
         bio          = excluded.bio,
         home_country = excluded.home_country`,
      [
        userId,
        USERNAME,
        DISPLAY_NAME,
        'https://images.unsplash.com/photo-1504593811423-6dd665756598?auto=format&fit=facearea&facepad=2.5&w=400&h=400&q=80',
        'PoC demo traveler — hikes, climbs, late-night rides.',
        'Colombia',
      ],
    );

    // Wipe prior demo data for this user so re-running produces deterministic state.
    await client.query('delete from public.activities where user_id = $1', [userId]);
    await client.query('delete from public.comments  where author_id = $1', [userId]);
    await client.query('delete from public.likes     where user_id = $1', [userId]);
    await client.query('delete from public.ratings   where user_id = $1', [userId]);

    for (const a of DEMO_ACTIVITIES) {
      const startMs = Date.now() - a.start_offset_days * 86_400_000;
      const endMs = startMs + a.duration_min * 60_000;
      const track = makeTrack(a.center[0], a.center[1], a.start_elev, a.points, a.step, startMs);

      await client.query(
        `insert into public.activities
           (id, user_id, expedition_id, activity_type, title, started_at, ended_at,
            distance_km, elevation_gain_m, duration_seconds, avg_speed_kmh, notes)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
        [
          a.id,
          userId,
          a.expedition_id,
          a.activity_type,
          a.title,
          new Date(startMs).toISOString(),
          new Date(endMs).toISOString(),
          a.distance_km,
          a.elevation_gain_m,
          a.duration_min * 60,
          a.distance_km / (a.duration_min / 60),
          a.notes,
        ],
      );

      for (const p of track) {
        await client.query(
          `insert into public.activity_tracks
             (activity_id, recorded_at, lat, lng, altitude_m, sequence)
           values ($1,$2,$3,$4,$5,$6)`,
          [a.id, p.ts, p.lat, p.lng, p.altitude_m, p.seq],
        );
      }
    }

    // Ratings + likes + comments on attended expeditions only.
    const attended = DEMO_ACTIVITIES.filter((a) => a.expedition_id).map((a) => a.expedition_id);
    for (const exp of attended) {
      await client.query(
        `insert into public.likes (user_id, expedition_id) values ($1, $2) on conflict do nothing`,
        [userId, exp],
      );
    }
    await client.query(
      `insert into public.ratings (user_id, expedition_id, stars, review) values
         ($1, '22222222-0000-0000-0000-000000000009', 5, 'Frailejones al amanecer. 10/10.'),
         ($1, '22222222-0000-0000-0000-000000000002', 4, 'Barro en la bajada pero las palmas valen cada peso.'),
         ($1, '22222222-0000-0000-0000-000000000007', 4, 'Las 740 escaleras pesan, la vista compensa.')
       on conflict (user_id, expedition_id) do update set stars = excluded.stars, review = excluded.review`,
      [userId],
    );
    await client.query(
      `insert into public.comments (id, expedition_id, author_id, parent_id, body) values
         ('aaaa0002-0000-0000-0000-000000000001', '22222222-0000-0000-0000-000000000009', $1, null,
          'Hice este loop la semana pasada. Salir antes de 5 AM vale totalmente la pena por el amanecer.'),
         ('aaaa0002-0000-0000-0000-000000000002', '22222222-0000-0000-0000-000000000002', $1, null,
          'Recomendación: lleven termo — hace frío en la parte alta aunque el sol pegue.'),
         ('aaaa0002-0000-0000-0000-000000000003', '22222222-0000-0000-0000-000000000007', $1, null,
          'Si pueden, suban al Peñón antes de las 8 AM, mucho menos gente.')
       on conflict (id) do update set body = excluded.body`,
      [userId],
    );

    // Override totals so the UI matches the seeded activity history.
    const totalDistanceKm = DEMO_ACTIVITIES.reduce((s, a) => s + a.distance_km, 0);
    const totalElevationM = DEMO_ACTIVITIES.reduce((s, a) => s + a.elevation_gain_m, 0);
    const tier =
      totalDistanceKm >= 500 ? 'gold' : totalDistanceKm >= 200 ? 'silver' : 'bronze';
    await client.query(
      `update public.profiles
          set total_distance_km = $2,
              total_elevation_m = $3,
              tier              = $4
        where id = $1`,
      [userId, Math.round(totalDistanceKm * 10) / 10, Math.round(totalElevationM), tier],
    );

    console.log('✔ demo user seeded');
  } finally {
    await client.end().catch(() => {});
  }

  console.log('');
  console.log('================================================');
  console.log('  Demo login');
  console.log('  Email:    ' + EMAIL);
  console.log('  Password: ' + PASSWORD);
  console.log('================================================');
}

main().catch((e) => {
  console.error('✘ seed failed:', e);
  process.exit(1);
});
