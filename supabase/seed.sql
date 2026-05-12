-- ============================================================================
-- Minga Expeditions · seed data
-- Idempotent — safe to re-run. Uses fixed UUIDs so re-running upserts.
-- Photos are sourced from Unsplash (free license) with photographer attribution.
-- ============================================================================

-- ---------- photo attributions ---------------------------------------------
insert into public.photo_attributions (id, photographer_name, source_url, license, license_url, notes) values
  ('a0000001-0000-0000-0000-000000000001', 'Diego Jimenez',      'https://unsplash.com/photos/APvisEFJNDM', 'Unsplash License', 'https://unsplash.com/license', 'Ciudad Perdida jungle ridge'),
  ('a0000001-0000-0000-0000-000000000002', 'Random Institute',   'https://unsplash.com/photos/A87iL2xNa-o', 'Unsplash License', 'https://unsplash.com/license', 'Valle de Cocora wax palms'),
  ('a0000001-0000-0000-0000-000000000003', 'Luis Poletti',       'https://unsplash.com/photos/8j13hGX9-Wk', 'Unsplash License', 'https://unsplash.com/license', 'Tayrona coast hike'),
  ('a0000001-0000-0000-0000-000000000004', 'Random Institute',   'https://unsplash.com/photos/Y9qblLq6jLM', 'Unsplash License', 'https://unsplash.com/license', 'Guatapé climb overlook'),
  ('a0000001-0000-0000-0000-000000000005', 'Flavia Carpio',      'https://unsplash.com/photos/7nc4kqXsxpM', 'Unsplash License', 'https://unsplash.com/license', 'Nevado del Ruiz ridge'),
  ('a0000001-0000-0000-0000-000000000006', 'Esteban Castle',     'https://unsplash.com/photos/qP5PgZJcmKI', 'Unsplash License', 'https://unsplash.com/license', 'Cartagena street scene'),
  ('a0000001-0000-0000-0000-000000000007', 'Makalu',             'https://unsplash.com/photos/vjMgqUkS8q8', 'Unsplash License', 'https://unsplash.com/license', 'Andes cycling route'),
  ('a0000001-0000-0000-0000-000000000008', 'Charl Folscher',     'https://unsplash.com/photos/8pjd1m7f7_c', 'Unsplash License', 'https://unsplash.com/license', 'Coffee triangle plantation'),
  ('a0000001-0000-0000-0000-000000000009', 'Vince Gx',           'https://unsplash.com/photos/8ccaYo-Zuys', 'Unsplash License', 'https://unsplash.com/license', 'Caño Cristales river'),
  ('a0000001-0000-0000-0000-000000000010', 'Ricardo Gomez Angel','https://unsplash.com/photos/PwxeoyujIqk', 'Unsplash License', 'https://unsplash.com/license', 'Medellín skyline at dusk')
on conflict (id) do update set
  photographer_name = excluded.photographer_name,
  source_url = excluded.source_url,
  license = excluded.license,
  license_url = excluded.license_url,
  notes = excluded.notes;

-- ---------- demo profiles --------------------------------------------------
-- Note: these are "presenter" authors, independent of auth.users. Real sign-ups
-- get their own profile via the on_auth_user_created trigger.
insert into public.profiles (id, username, display_name, avatar_url, bio, home_country, total_distance_km, total_elevation_m, tier) values
  ('11111111-1111-1111-1111-111111111101', 'minga.official', 'Minga Expeditions',
    'https://api.dicebear.com/9.x/shapes/svg?seed=minga&backgroundColor=ED8B00',
    'Connecting travelers with the trails, rivers, and people of Colombia.', 'Colombia',
    3120.5, 84200, 'diamond'),
  ('11111111-1111-1111-1111-111111111102', 'juli.trails',     'Juliana Restrepo',
    'https://api.dicebear.com/9.x/adventurer/svg?seed=juliana&backgroundColor=FFE3B8',
    'Hiker from Medellín · 8 páramos this year. Coffee on the trail.', 'Colombia',
    640.2, 28900, 'gold'),
  ('11111111-1111-1111-1111-111111111103', 'andres.rides',    'Andrés Gómez',
    'https://api.dicebear.com/9.x/adventurer/svg?seed=andres&backgroundColor=C5E4C8',
    'Cyclist · on a mission to ride every pass above 3000m.', 'Colombia',
    2480.0, 51200, 'diamond'),
  ('11111111-1111-1111-1111-111111111104', 'caro.wild',       'Carolina Mora',
    'https://api.dicebear.com/9.x/adventurer/svg?seed=carolina&backgroundColor=ECF5E8',
    'Wildlife guide · Amazonas. Bring your bug spray.', 'Colombia',
    215.7, 7400, 'silver'),
  ('11111111-1111-1111-1111-111111111105', 'lucas.runs',      'Lucas Herrera',
    'https://api.dicebear.com/9.x/adventurer/svg?seed=lucas&backgroundColor=FFF8EC',
    'Trail runner · Bogotá weekends.', 'Colombia',
    88.3, 3100, 'bronze')
on conflict (id) do update set
  username = excluded.username,
  display_name = excluded.display_name,
  avatar_url = excluded.avatar_url,
  bio = excluded.bio,
  home_country = excluded.home_country,
  total_distance_km = excluded.total_distance_km,
  total_elevation_m = excluded.total_elevation_m,
  tier = excluded.tier;

-- ---------- expeditions ----------------------------------------------------
insert into public.expeditions (
  id, author_id, title, description, category, location_name, region, country,
  start_lat, start_lng, distance_km, elevation_gain_m, difficulty,
  price_cents, currency, cover_photo_url, is_official, is_published
) values
  ('22222222-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111101',
    'Ciudad Perdida — 4 Day Lost City Trek',
    'Four days deep into the Sierra Nevada de Santa Marta to reach the Tayrona archaeological city of Teyuna. Moderate-to-strenuous jungle hiking, river crossings, and nights in hammock camps run by Wiwa guides.',
    'trekking', 'Ciudad Perdida', 'Magdalena', 'Colombia',
    11.0389, -73.9254, 46.0, 2400, 4,
    145000000, 'COP',
    'https://images.unsplash.com/photo-1591701739721-d32f08ff3b6d?w=1600',
    true, true),

  ('22222222-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111102',
    'Valle de Cocora Loop',
    'Classic day hike through cloud forest and the towering wax palms of Cocora. Leaves from Salento; loop version adds Acaime hummingbird house and a muddy ridge return.',
    'hiking', 'Valle de Cocora', 'Quindío', 'Colombia',
    4.6373, -75.4860, 12.5, 650, 3,
    38000000, 'COP',
    'https://images.unsplash.com/photo-1568438350562-2cae6d394ad0?w=1600',
    false, true),

  ('22222222-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111101',
    'Tayrona Coast — Cabo San Juan',
    'Coastal jungle walk from El Zaíno to Cabo San Juan. White sand, Kogi villages, and swimming coves. Easy terrain with one sweaty hill near Arrecifes.',
    'hiking', 'Parque Tayrona', 'Magdalena', 'Colombia',
    11.3114, -74.0319, 8.2, 210, 2,
    68000000, 'COP',
    'https://images.unsplash.com/photo-1589308078055-a5fb12b25f5b?w=1600',
    true, true),

  ('22222222-0000-0000-0000-000000000004', '11111111-1111-1111-1111-111111111103',
    'Alto de Letras — the World''s Longest Climb',
    '82 km of continuous climbing from Mariquita to the páramo above Manizales — over 3,600m elevation gain. Bring warm kit for the descent.',
    'cycling', 'Alto de Letras', 'Tolima / Caldas', 'Colombia',
    5.0667, -75.3667, 82.0, 3650, 5,
    85000000, 'COP',
    'https://images.unsplash.com/photo-1517649763962-0c623066013b?w=1600',
    false, true),

  ('22222222-0000-0000-0000-000000000005', '11111111-1111-1111-1111-111111111101',
    'Nevado del Ruiz Summit Approach',
    'High-altitude trek to the ash slopes of Nevado del Ruiz (weather permitting). Guided to respect volcanic activity zones; includes acclimatization stop in Manizales.',
    'trekking', 'Nevado del Ruiz', 'Caldas', 'Colombia',
    4.8925, -75.3239, 14.0, 900, 4,
    210000000, 'COP',
    'https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?w=1600',
    true, true),

  ('22222222-0000-0000-0000-000000000006', '11111111-1111-1111-1111-111111111104',
    'Caño Cristales — River of Five Colors',
    'Seasonal expedition (June–Nov) to the Serranía de la Macarena to see the famous red-algae river. Includes charter flight to La Macarena and guided swimming sections.',
    'wildlife', 'Caño Cristales', 'Meta', 'Colombia',
    2.2667, -73.7833, 18.0, 180, 3,
    320000000, 'COP',
    'https://images.unsplash.com/photo-1590523278191-995cbcda646b?w=1600',
    true, true),

  ('22222222-0000-0000-0000-000000000007', '11111111-1111-1111-1111-111111111102',
    'Guatapé Rock Climb & Lake Loop',
    'Climb the 740 steps of El Peñón de Guatapé, then a 10 km lakeside walk through pueblito streets.',
    'hiking', 'Guatapé', 'Antioquia', 'Colombia',
    6.2328, -75.1597, 11.0, 370, 2,
    52000000, 'COP',
    'https://images.unsplash.com/photo-1590424593747-80f6d9d1a7a7?w=1600',
    false, true),

  ('22222222-0000-0000-0000-000000000008', '11111111-1111-1111-1111-111111111101',
    'Eje Cafetero — Coffee Farm Expedition',
    '3-day immersion in the coffee triangle: picking with a fifth-generation finca family, roasting workshop, and sunrise ride to mirador La Cima.',
    'cultural', 'Eje Cafetero', 'Quindío', 'Colombia',
    4.5339, -75.6811, 24.0, 820, 2,
    95000000, 'COP',
    'https://images.unsplash.com/photo-1607345366928-199797ff434c?w=1600',
    true, true),

  ('22222222-0000-0000-0000-000000000009', '11111111-1111-1111-1111-111111111105',
    'Chingaza Páramo Run',
    'Early-morning trail run through frailejón-dotted páramo above Bogotá. 18 km with a steep kick at km 14.',
    'running', 'Parque Nacional Chingaza', 'Cundinamarca', 'Colombia',
    4.6872, -73.7536, 18.0, 700, 3,
    42000000, 'COP',
    'https://images.unsplash.com/photo-1596728325488-58c87691e9af?w=1600',
    false, true),

  ('22222222-0000-0000-0000-000000000010', '11111111-1111-1111-1111-111111111101',
    'Cartagena Walled-City Walkabout',
    'Slow afternoon walk through Getsemaní and the walled city — murals, dance, and the best limonada de coco on each block.',
    'cultural', 'Cartagena', 'Bolívar', 'Colombia',
    10.4236, -75.5518, 3.8, 40, 1,
    45000000, 'COP',
    'https://images.unsplash.com/photo-1601199587425-d8dbdff7fd91?w=1600',
    true, true)
on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  category = excluded.category,
  location_name = excluded.location_name,
  region = excluded.region,
  distance_km = excluded.distance_km,
  elevation_gain_m = excluded.elevation_gain_m,
  difficulty = excluded.difficulty,
  price_cents = excluded.price_cents,
  cover_photo_url = excluded.cover_photo_url,
  is_official = excluded.is_official;

-- Backfill terrain tags on the seeded expeditions. Kept as a separate update
-- so we don't have to rewrite the insert/upsert column list every time we
-- adjust the seed.
update public.expeditions set terrain_tags = case id
  when '22222222-0000-0000-0000-000000000001'::uuid then ARRAY['mountain','jungle','river']::public.terrain_tag[]
  when '22222222-0000-0000-0000-000000000002'::uuid then ARRAY['mountain','forest']::public.terrain_tag[]
  when '22222222-0000-0000-0000-000000000003'::uuid then ARRAY['coast','jungle']::public.terrain_tag[]
  when '22222222-0000-0000-0000-000000000004'::uuid then ARRAY['mountain']::public.terrain_tag[]
  when '22222222-0000-0000-0000-000000000005'::uuid then ARRAY['mountain','snow']::public.terrain_tag[]
  when '22222222-0000-0000-0000-000000000006'::uuid then ARRAY['river','jungle']::public.terrain_tag[]
  when '22222222-0000-0000-0000-000000000007'::uuid then ARRAY['mountain','river']::public.terrain_tag[]
  when '22222222-0000-0000-0000-000000000008'::uuid then ARRAY['forest','mountain']::public.terrain_tag[]
  when '22222222-0000-0000-0000-000000000009'::uuid then ARRAY['mountain']::public.terrain_tag[]
  when '22222222-0000-0000-0000-000000000010'::uuid then ARRAY['urban','coast']::public.terrain_tag[]
end
where id in (
  '22222222-0000-0000-0000-000000000001',
  '22222222-0000-0000-0000-000000000002',
  '22222222-0000-0000-0000-000000000003',
  '22222222-0000-0000-0000-000000000004',
  '22222222-0000-0000-0000-000000000005',
  '22222222-0000-0000-0000-000000000006',
  '22222222-0000-0000-0000-000000000007',
  '22222222-0000-0000-0000-000000000008',
  '22222222-0000-0000-0000-000000000009',
  '22222222-0000-0000-0000-000000000010'
);

-- ---------- expedition photos (gallery) ------------------------------------
insert into public.expedition_photos (id, expedition_id, url, caption, order_index, attribution_id) values
  ('33333333-0000-0000-0000-000000000001', '22222222-0000-0000-0000-000000000001',
    'https://images.unsplash.com/photo-1591701739721-d32f08ff3b6d?w=1600', 'Jungle ridge near Teyuna', 0,
    'a0000001-0000-0000-0000-000000000001'),
  ('33333333-0000-0000-0000-000000000002', '22222222-0000-0000-0000-000000000001',
    'https://images.unsplash.com/photo-1518182170546-07661fd94144?w=1600', 'Hammock camp on night 2', 1,
    'a0000001-0000-0000-0000-000000000001'),
  ('33333333-0000-0000-0000-000000000003', '22222222-0000-0000-0000-000000000002',
    'https://images.unsplash.com/photo-1568438350562-2cae6d394ad0?w=1600', 'Wax palms of Cocora', 0,
    'a0000001-0000-0000-0000-000000000002'),
  ('33333333-0000-0000-0000-000000000004', '22222222-0000-0000-0000-000000000003',
    'https://images.unsplash.com/photo-1589308078055-a5fb12b25f5b?w=1600', 'Cabo San Juan cove', 0,
    'a0000001-0000-0000-0000-000000000003'),
  ('33333333-0000-0000-0000-000000000005', '22222222-0000-0000-0000-000000000004',
    'https://images.unsplash.com/photo-1517649763962-0c623066013b?w=1600', 'Climbing into the clouds', 0,
    'a0000001-0000-0000-0000-000000000007'),
  ('33333333-0000-0000-0000-000000000006', '22222222-0000-0000-0000-000000000005',
    'https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?w=1600', 'Ruiz ash field', 0,
    'a0000001-0000-0000-0000-000000000005'),
  ('33333333-0000-0000-0000-000000000007', '22222222-0000-0000-0000-000000000006',
    'https://images.unsplash.com/photo-1590523278191-995cbcda646b?w=1600', 'Algae bloom season', 0,
    'a0000001-0000-0000-0000-000000000009'),
  ('33333333-0000-0000-0000-000000000008', '22222222-0000-0000-0000-000000000007',
    'https://images.unsplash.com/photo-1590424593747-80f6d9d1a7a7?w=1600', 'El Peñón overlook', 0,
    'a0000001-0000-0000-0000-000000000004'),
  ('33333333-0000-0000-0000-000000000009', '22222222-0000-0000-0000-000000000008',
    'https://images.unsplash.com/photo-1607345366928-199797ff434c?w=1600', 'Coffee picking', 0,
    'a0000001-0000-0000-0000-000000000008'),
  ('33333333-0000-0000-0000-000000000010', '22222222-0000-0000-0000-000000000010',
    'https://images.unsplash.com/photo-1601199587425-d8dbdff7fd91?w=1600', 'Walled-city evening', 0,
    'a0000001-0000-0000-0000-000000000006')
on conflict (id) do update set
  url = excluded.url,
  caption = excluded.caption,
  order_index = excluded.order_index,
  attribution_id = excluded.attribution_id;

-- ---------- comments (threaded) -------------------------------------------
insert into public.comments (id, expedition_id, author_id, parent_id, body) values
  ('44444444-0000-0000-0000-000000000001', '22222222-0000-0000-0000-000000000001',
    '11111111-1111-1111-1111-111111111102', null,
    'Did this in February — the river crossing on day 2 is deeper than it looks. Bring sandals you don''t mind losing.'),
  ('44444444-0000-0000-0000-000000000002', '22222222-0000-0000-0000-000000000001',
    '11111111-1111-1111-1111-111111111103', '44444444-0000-0000-0000-000000000001',
    'Cosigned. I hiked in Teva''s and my feet were happier than everyone else''s.'),
  ('44444444-0000-0000-0000-000000000003', '22222222-0000-0000-0000-000000000001',
    '11111111-1111-1111-1111-111111111104', null,
    'How is this in the rainy season (Oct/Nov)? Is the mud manageable?'),
  ('44444444-0000-0000-0000-000000000004', '22222222-0000-0000-0000-000000000001',
    '11111111-1111-1111-1111-111111111101', '44444444-0000-0000-0000-000000000003',
    'Manageable but slow — expect each day to stretch 2-3 extra hours. We move groups to longer itineraries Oct 15 onward.'),
  ('44444444-0000-0000-0000-000000000005', '22222222-0000-0000-0000-000000000002',
    '11111111-1111-1111-1111-111111111105', null,
    'Fantastic sunrise option if you leave Salento before 6am. Cold at the top so bring a shell.'),
  ('44444444-0000-0000-0000-000000000006', '22222222-0000-0000-0000-000000000004',
    '11111111-1111-1111-1111-111111111102', null,
    '82 km straight up is unreal. I bailed at km 60 last time; going back in May for revenge.'),
  ('44444444-0000-0000-0000-000000000007', '22222222-0000-0000-0000-000000000006',
    '11111111-1111-1111-1111-111111111103', null,
    'Worth every peso — a genuinely surreal landscape. Don''t wear sunscreen in the water, it kills the algae.'),
  ('44444444-0000-0000-0000-000000000008', '22222222-0000-0000-0000-000000000008',
    '11111111-1111-1111-1111-111111111104', null,
    'The roasting workshop was the highlight for me. Bring an empty bag — you''ll want to take beans home.')
on conflict (id) do update set body = excluded.body;

-- ---------- likes ----------------------------------------------------------
insert into public.likes (user_id, expedition_id) values
  ('11111111-1111-1111-1111-111111111102', '22222222-0000-0000-0000-000000000001'),
  ('11111111-1111-1111-1111-111111111103', '22222222-0000-0000-0000-000000000001'),
  ('11111111-1111-1111-1111-111111111104', '22222222-0000-0000-0000-000000000001'),
  ('11111111-1111-1111-1111-111111111105', '22222222-0000-0000-0000-000000000001'),
  ('11111111-1111-1111-1111-111111111102', '22222222-0000-0000-0000-000000000004'),
  ('11111111-1111-1111-1111-111111111105', '22222222-0000-0000-0000-000000000004'),
  ('11111111-1111-1111-1111-111111111103', '22222222-0000-0000-0000-000000000002'),
  ('11111111-1111-1111-1111-111111111104', '22222222-0000-0000-0000-000000000006'),
  ('11111111-1111-1111-1111-111111111102', '22222222-0000-0000-0000-000000000008'),
  ('11111111-1111-1111-1111-111111111105', '22222222-0000-0000-0000-000000000009')
on conflict do nothing;

-- ---------- ratings --------------------------------------------------------
insert into public.ratings (user_id, expedition_id, stars, review) values
  ('11111111-1111-1111-1111-111111111102', '22222222-0000-0000-0000-000000000001', 5, 'Life-changing. Go with Minga.'),
  ('11111111-1111-1111-1111-111111111103', '22222222-0000-0000-0000-000000000001', 5, null),
  ('11111111-1111-1111-1111-111111111104', '22222222-0000-0000-0000-000000000001', 4, 'Strenuous — be honest with yourself about fitness.'),
  ('11111111-1111-1111-1111-111111111105', '22222222-0000-0000-0000-000000000002', 4, 'Crowded but gorgeous.'),
  ('11111111-1111-1111-1111-111111111102', '22222222-0000-0000-0000-000000000003', 5, null),
  ('11111111-1111-1111-1111-111111111105', '22222222-0000-0000-0000-000000000004', 5, 'The climb of a lifetime.'),
  ('11111111-1111-1111-1111-111111111104', '22222222-0000-0000-0000-000000000006', 5, 'Worth the charter flight.'),
  ('11111111-1111-1111-1111-111111111103', '22222222-0000-0000-0000-000000000008', 4, 'Wonderful hosts.')
on conflict (user_id, expedition_id) do update set
  stars = excluded.stars,
  review = excluded.review;

-- ---------- demo activities for minga-official (anchors tier progress) -----
insert into public.activities (id, user_id, expedition_id, activity_type, title, started_at, ended_at, distance_km, elevation_gain_m, duration_seconds, avg_speed_kmh, notes) values
  ('55555555-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111102',
    '22222222-0000-0000-0000-000000000002', 'hike', 'Cocora loop — golden-hour return',
    now() - interval '14 days', now() - interval '14 days' + interval '4h 10m',
    12.7, 660, 15000, 3.05, 'Hit the mirador at 4:30pm for the light.'),
  ('55555555-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111103',
    '22222222-0000-0000-0000-000000000004', 'ride', 'Alto de Letras — sane pace',
    now() - interval '40 days', now() - interval '40 days' + interval '7h 30m',
    82.3, 3680, 27000, 10.97, null),
  ('55555555-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111105',
    '22222222-0000-0000-0000-000000000009', 'run', 'Chingaza páramo sunrise',
    now() - interval '3 days', now() - interval '3 days' + interval '2h',
    18.1, 710, 7200, 9.05, 'Frost on the frailejones!')
on conflict (id) do update set
  title = excluded.title,
  distance_km = excluded.distance_km,
  elevation_gain_m = excluded.elevation_gain_m,
  duration_seconds = excluded.duration_seconds;

-- Override totals with the narrative numbers after activity triggers settled.
-- The trigger would otherwise leave Juliana at ~12km (just the one seeded activity).
-- For a demo we want the profile to look like a year of travel.
update public.profiles set total_distance_km = 3120.5, total_elevation_m = 84200, tier = 'diamond' where id = '11111111-1111-1111-1111-111111111101';
update public.profiles set total_distance_km = 640.2,  total_elevation_m = 28900, tier = 'gold'    where id = '11111111-1111-1111-1111-111111111102';
update public.profiles set total_distance_km = 2480.0, total_elevation_m = 51200, tier = 'diamond' where id = '11111111-1111-1111-1111-111111111103';
update public.profiles set total_distance_km = 215.7,  total_elevation_m = 7400,  tier = 'silver'  where id = '11111111-1111-1111-1111-111111111104';
update public.profiles set total_distance_km = 88.3,   total_elevation_m = 3100,  tier = 'bronze'  where id = '11111111-1111-1111-1111-111111111105';

-- ---------- expedition salidas (dated departures) --------------------------
-- A salida is a specific scheduled instance of an expedition template. Dates
-- are anchored relative to now() so the seed never goes stale. Each salida
-- can override the template's capacity/price/currency.
insert into public.expedition_salidas (id, expedition_id, starts_at, ends_at, timezone, capacity, seats_taken, price_cents, currency, is_published, notes) values
  ('66666666-0000-0000-0000-000000000001', '22222222-0000-0000-0000-000000000001',
    now() + interval '14 days', now() + interval '18 days', 'America/Bogota', 12, 5, null, null, true,
    'Wiwa guides confirmed. Hammocks provided.'),
  ('66666666-0000-0000-0000-000000000002', '22222222-0000-0000-0000-000000000001',
    now() + interval '45 days', now() + interval '49 days', 'America/Bogota', 12, 0, null, null, true, null),
  ('66666666-0000-0000-0000-000000000003', '22222222-0000-0000-0000-000000000001',
    now() + interval '90 days', now() + interval '94 days', 'America/Bogota', 12, 0, 160000000, 'COP', true,
    'Holiday departure — premium pricing.'),

  ('66666666-0000-0000-0000-000000000010', '22222222-0000-0000-0000-000000000002',
    now() + interval '7 days', now() + interval '7 days' + interval '6 hours', 'America/Bogota', 20, 3, null, null, true, null),
  ('66666666-0000-0000-0000-000000000011', '22222222-0000-0000-0000-000000000002',
    now() + interval '21 days', now() + interval '21 days' + interval '6 hours', 'America/Bogota', 20, 0, null, null, true, null),
  ('66666666-0000-0000-0000-000000000012', '22222222-0000-0000-0000-000000000002',
    now() + interval '35 days', now() + interval '35 days' + interval '6 hours', 'America/Bogota', 20, 0, null, null, true, null),

  ('66666666-0000-0000-0000-000000000020', '22222222-0000-0000-0000-000000000003',
    now() + interval '10 days', now() + interval '11 days', 'America/Bogota', 16, 8, null, null, true, null),
  ('66666666-0000-0000-0000-000000000021', '22222222-0000-0000-0000-000000000003',
    now() + interval '24 days', now() + interval '25 days', 'America/Bogota', 16, 2, null, null, true, null),

  ('66666666-0000-0000-0000-000000000030', '22222222-0000-0000-0000-000000000004',
    now() + interval '17 days', now() + interval '17 days' + interval '10 hours', 'America/Bogota', 8, 1, null, null, true,
    'Group ride with support van.'),
  ('66666666-0000-0000-0000-000000000031', '22222222-0000-0000-0000-000000000004',
    now() + interval '58 days', now() + interval '58 days' + interval '10 hours', 'America/Bogota', 8, 0, null, null, true, null),

  ('66666666-0000-0000-0000-000000000040', '22222222-0000-0000-0000-000000000005',
    now() + interval '28 days', now() + interval '30 days', 'America/Bogota', 6, 2, null, null, true,
    'Weather contingency window built in.'),

  ('66666666-0000-0000-0000-000000000050', '22222222-0000-0000-0000-000000000006',
    now() + interval '40 days', now() + interval '43 days', 'America/Bogota', 10, 4, null, null, true, null),
  ('66666666-0000-0000-0000-000000000051', '22222222-0000-0000-0000-000000000006',
    now() + interval '70 days', now() + interval '73 days', 'America/Bogota', 10, 0, null, null, true, null),

  ('66666666-0000-0000-0000-000000000060', '22222222-0000-0000-0000-000000000007',
    now() + interval '12 days', now() + interval '12 days' + interval '5 hours', 'America/Bogota', null, 0, null, null, true, null),
  ('66666666-0000-0000-0000-000000000061', '22222222-0000-0000-0000-000000000007',
    now() + interval '26 days', now() + interval '26 days' + interval '5 hours', 'America/Bogota', null, 0, null, null, true, null),

  ('66666666-0000-0000-0000-000000000070', '22222222-0000-0000-0000-000000000008',
    now() + interval '20 days', now() + interval '22 days', 'America/Bogota', 14, 6, null, null, true, null),
  ('66666666-0000-0000-0000-000000000071', '22222222-0000-0000-0000-000000000008',
    now() + interval '55 days', now() + interval '57 days', 'America/Bogota', 14, 1, null, null, true, null),

  ('66666666-0000-0000-0000-000000000080', '22222222-0000-0000-0000-000000000009',
    now() + interval '6 days', now() + interval '6 days' + interval '4 hours', 'America/Bogota', null, 0, null, null, true,
    'Pre-dawn meet at the Chingaza entry gate.'),
  ('66666666-0000-0000-0000-000000000081', '22222222-0000-0000-0000-000000000009',
    now() + interval '20 days', now() + interval '20 days' + interval '4 hours', 'America/Bogota', null, 0, null, null, true, null),

  ('66666666-0000-0000-0000-000000000090', '22222222-0000-0000-0000-000000000010',
    now() + interval '3 days', now() + interval '3 days' + interval '4 hours', 'America/Bogota', 12, 9, null, null, true, null),
  ('66666666-0000-0000-0000-000000000091', '22222222-0000-0000-0000-000000000010',
    now() + interval '15 days', now() + interval '15 days' + interval '4 hours', 'America/Bogota', 12, 0, null, null, true, null)
on conflict (id) do update set
  starts_at   = excluded.starts_at,
  ends_at     = excluded.ends_at,
  capacity    = excluded.capacity,
  seats_taken = excluded.seats_taken,
  price_cents = excluded.price_cents,
  currency    = excluded.currency,
  is_published = excluded.is_published,
  notes       = excluded.notes;
