#!/usr/bin/env node
// Creates (or refreshes) a demo auth user with pre-populated activities,
// tracks, comments, likes, and ratings. Safe to re-run — everything upserts.
//
// Requires these env vars:
//   SUPABASE_URL                 e.g. https://dgkmvoteliomghoctwrd.supabase.co
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

const DEMO_ACTIVITIES = [
  {
    // Attended official expedition: Chingaza Páramo Run
    id: 'aaaa0001-0000-0000-0000-000000000001',
    expedition_id: '22222222-0000-0000-0000-000000000009',
    activity_type: 'run',
    title: 'Chingaza sunrise — 18 km',
    notes: 'Frost on the frailejones. Cold start at 4:40 AM.',
    start_offset_days: 2,
    duration_min: 2 * 60 + 5,
    center: [-73.7536, 4.6872],
    start_elev: 3200,
    points: 60,
    step: 300,
    distance_km: 18.1,
    elevation_gain_m: 720,
  },
  {
    // Attended official expedition: Valle de Cocora Loop
    id: 'aaaa0001-0000-0000-0000-000000000002',
    expedition_id: '22222222-0000-0000-0000-000000000002',
    activity_type: 'hike',
    title: 'Valle de Cocora — mirador loop',
    notes: 'Caught the wax palms at golden hour.',
    start_offset_days: 10,
    duration_min: 4 * 60 + 12,
    center: [-75.486, 4.6373],
    start_elev: 2400,
    points: 55,
    step: 240,
    distance_km: 12.7,
    elevation_gain_m: 660,
  },
  {
    // Attended community expedition: Guatapé Rock Climb
    id: 'aaaa0001-0000-0000-0000-000000000003',
    expedition_id: '22222222-0000-0000-0000-000000000007',
    activity_type: 'hike',
    title: 'El Peñón de Guatapé + lake',
    notes: 'Climbed the 740 steps then a lakeside loop. ~11 km.',
    start_offset_days: 22,
    duration_min: 3 * 60 + 20,
    center: [-75.1597, 6.2328],
    start_elev: 1920,
    points: 50,
    step: 230,
    distance_km: 11.2,
    elevation_gain_m: 390,
  },
  {
    // Untied: solo Monserrate training run
    id: 'aaaa0001-0000-0000-0000-000000000004',
    expedition_id: null,
    activity_type: 'hike',
    title: 'Monserrate stair push',
    notes: 'Training hike — steep, short, sweaty.',
    start_offset_days: 35,
    duration_min: 85,
    center: [-74.0558, 4.6061],
    start_elev: 2640,
    points: 30,
    step: 130,
    distance_km: 3.6,
    elevation_gain_m: 540,
  },
];

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

    // Override totals so the UI shows a richer demo picture than just the 4 seeded activities.
    await client.query(
      `update public.profiles
          set total_distance_km = 680.4,
              total_elevation_m = 31800,
              tier              = 'gold'
        where id = $1`,
      [userId],
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
