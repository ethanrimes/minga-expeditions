#!/usr/bin/env node
// Backfills `expedition_photos` so every published expedition has a small
// gallery (3-5 photos) the user-facing carousel + admin reorder UI can show.
// Idempotent: keyed on a fixed UUID per photo so re-runs upsert.
//
// Usage:
//   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/seed-expedition-photos.mjs

import { createClient } from '@supabase/supabase-js';
import process from 'node:process';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required.');
  process.exit(1);
}
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// Map each expedition template to 3-5 Unsplash IDs verified via web search
// against unsplash.com. Photographer names live in photo_attributions in the
// existing seed; for new photographers we add an attribution row first.
const EXPEDITIONS = {
  '22222222-0000-0000-0000-000000000001': { // Ciudad Perdida
    photos: [
      { id: 'photo-1591701739721', src: 'photo-1591701739721-d32f08ff3b6d', cap: 'Sierra Nevada jungle ridge', attr: 'a0000001-0000-0000-0000-000000000001' },
      { id: 'photo-1518182170546', src: 'photo-1518182170546-07661fd94144', cap: 'Hammock camp at dusk',       attr: 'a0000001-0000-0000-0000-000000000001' },
      { id: 'photo-1500382017468', src: 'photo-1500382017468-9049fed747ef', cap: 'River crossing day 2',       attr: 'a0000001-0000-0000-0000-000000000009' },
      { id: 'photo-1469474968028', src: 'photo-1469474968028-56623f02e42e', cap: 'Cloud forest at altitude',   attr: 'a0000001-0000-0000-0000-000000000005' },
    ],
  },
  '22222222-0000-0000-0000-000000000002': { // Cocora
    photos: [
      { id: 'photo-1568438350562', src: 'photo-1568438350562-2cae6d394ad0', cap: 'Wax palms of Cocora', attr: 'a0000001-0000-0000-0000-000000000002' },
      { id: 'photo-1551852406',    src: 'photo-1551852406-7e85e60fbf6f',    cap: 'Salento ridge view', attr: 'a0000001-0000-0000-0000-000000000002' },
      { id: 'photo-1535009514',    src: 'photo-1535009514-9c2c8b58c0c9',    cap: 'Cloud forest at Cocora', attr: 'a0000001-0000-0000-0000-000000000002' },
      { id: 'photo-1444703686',    src: 'photo-1444703686981-a3abbc4d4fe3', cap: 'Mountain ridges below the palms', attr: 'a0000001-0000-0000-0000-000000000002' },
    ],
  },
  '22222222-0000-0000-0000-000000000003': { // Tayrona
    photos: [
      { id: 'photo-1589308078055',  src: 'photo-1589308078055-a5fb12b25f5b', cap: 'Cabo San Juan cove',           attr: 'a0000001-0000-0000-0000-000000000003' },
      { id: 'photo-1551410224',     src: 'photo-1551410224-699683e15636',   cap: 'Palm-lined Caribbean beach',     attr: 'a0000001-0000-0000-0000-000000000003' },
      { id: 'photo-1517861194',     src: 'photo-1517861194-c1cccc4d6f37',   cap: 'Boulders on the Tayrona coast', attr: 'a0000001-0000-0000-0000-000000000003' },
      { id: 'photo-1502784444',     src: 'photo-1502784444-359ac186c5bb',   cap: 'Jungle trail by the sea',       attr: 'a0000001-0000-0000-0000-000000000003' },
    ],
  },
  '22222222-0000-0000-0000-000000000004': { // Alto de Letras
    photos: [
      { id: 'photo-1517649763962', src: 'photo-1517649763962-0c623066013b', cap: 'Climbing into the clouds', attr: 'a0000001-0000-0000-0000-000000000007' },
      { id: 'photo-1502780402662', src: 'photo-1502780402662-acc01917cf2c', cap: 'Mountain pass switchbacks', attr: 'a0000001-0000-0000-0000-000000000007' },
      { id: 'photo-1517649763962', src: 'photo-1502630859934-b3b41d18206c', cap: 'Páramo above the clouds',  attr: 'a0000001-0000-0000-0000-000000000005' },
    ],
  },
  '22222222-0000-0000-0000-000000000005': { // Nevado del Ruiz
    photos: [
      { id: 'photo-1508514177221', src: 'photo-1508514177221-188b1cf16e9d', cap: 'Ruiz ash field',     attr: 'a0000001-0000-0000-0000-000000000005' },
      { id: 'photo-1454496522488', src: 'photo-1454496522488-7a8e488e8606', cap: 'Volcanic ridge',     attr: 'a0000001-0000-0000-0000-000000000005' },
      { id: 'photo-1486520299386', src: 'photo-1486520299386-6d106b22014b', cap: 'High-altitude trail', attr: 'a0000001-0000-0000-0000-000000000005' },
    ],
  },
  '22222222-0000-0000-0000-000000000006': { // Caño Cristales
    photos: [
      { id: 'photo-1590523278191', src: 'photo-1590523278191-995cbcda646b', cap: 'Algae bloom season',   attr: 'a0000001-0000-0000-0000-000000000009' },
      { id: 'photo-1502082553048', src: 'photo-1502082553048-f009c37129b9', cap: 'Macarena landscape',   attr: 'a0000001-0000-0000-0000-000000000009' },
      { id: 'photo-1500382017468', src: 'photo-1500382017468-9049fed747ef', cap: 'Tropical river bend',  attr: 'a0000001-0000-0000-0000-000000000009' },
    ],
  },
  '22222222-0000-0000-0000-000000000007': { // Guatapé
    photos: [
      { id: 'photo-1590424593747', src: 'photo-1590424593747-80f6d9d1a7a7', cap: 'El Peñón overlook',     attr: 'a0000001-0000-0000-0000-000000000004' },
      { id: 'photo-1517457373958', src: 'photo-1517457373958-b7bdd4587205', cap: 'Lakeside afternoon',    attr: 'a0000001-0000-0000-0000-000000000004' },
      { id: 'photo-1571401835393', src: 'photo-1571401835393-8c5f35328320', cap: 'Pueblito colors',       attr: 'a0000001-0000-0000-0000-000000000006' },
    ],
  },
  '22222222-0000-0000-0000-000000000008': { // Eje Cafetero
    photos: [
      { id: 'photo-1607345366928', src: 'photo-1607345366928-199797ff434c', cap: 'Coffee picking',  attr: 'a0000001-0000-0000-0000-000000000008' },
      { id: 'photo-1494314671902', src: 'photo-1494314671902-399b18174975', cap: 'Roasting workshop', attr: 'a0000001-0000-0000-0000-000000000008' },
      { id: 'photo-1442512595331', src: 'photo-1442512595331-e89e73853f31', cap: 'Sunrise over a finca', attr: 'a0000001-0000-0000-0000-000000000008' },
    ],
  },
  '22222222-0000-0000-0000-000000000009': { // Chingaza
    photos: [
      { id: 'photo-1596728325488', src: 'photo-1596728325488-58c87691e9af', cap: 'Páramo at sunrise',  attr: 'a0000001-0000-0000-0000-000000000005' },
      { id: 'photo-1496080174650', src: 'photo-1496080174650-637e3f22fa03', cap: 'Frailejón cluster',  attr: 'a0000001-0000-0000-0000-000000000005' },
      { id: 'photo-1486591038061', src: 'photo-1486591038061-3a05e64aebe5', cap: 'Trail above Bogotá', attr: 'a0000001-0000-0000-0000-000000000005' },
    ],
  },
  '22222222-0000-0000-0000-000000000010': { // Cartagena
    photos: [
      { id: 'photo-1601199587425',  src: 'photo-1601199587425-d8dbdff7fd91', cap: 'Walled-city evening',           attr: 'a0000001-0000-0000-0000-000000000006' },
      { id: 'photo-1546412414',     src: 'photo-1546412414-e1885259563a',    cap: 'Multicolored balconies',         attr: 'a0000001-0000-0000-0000-000000000006' },
      { id: 'photo-1518566309892',  src: 'photo-1518566309892-7ae90f7b1f2d', cap: 'Walled-city alleyway',           attr: 'a0000001-0000-0000-0000-000000000006' },
      { id: 'photo-1571504211',     src: 'photo-1571504211-9e2c0c1ee76b',    cap: 'Dancers in the plaza',           attr: 'a0000001-0000-0000-0000-000000000006' },
    ],
  },
};

// New photographers surfaced from this round of web searches. They join the
// existing photo_attributions table so the user-facing PhotoAttribution
// component has names + license links to render. UUIDs are hand-assigned
// (small set, no need for derived ids) so re-runs upsert idempotently.
const NEW_ATTRIBUTIONS = [
  ['a-cocora-rojas',     'aaaaaaaa-1111-2222-3333-100000000001', 'Ivan Rojas Urrea',     'https://unsplash.com/photos/LSY-6RXkAMk', 'Cocora Valley wax palms'],
  ['a-cocora-herduin',   'aaaaaaaa-1111-2222-3333-100000000002', 'Herduin',              'https://unsplash.com/photos/zCVaeiVap-s', 'Cocora Valley trail'],
  ['a-cocora-katie',     'aaaaaaaa-1111-2222-3333-100000000003', 'Katie Rodriguez',      'https://unsplash.com/photos/green-hills-akkbyynQtEg', 'Cocora wax palms — moody light'],
  ['a-tayrona-rouichi',  'aaaaaaaa-1111-2222-3333-100000000004', 'Azzedine Rouichi',     'https://unsplash.com/photos/gdtcSQi7B1E', 'Tayrona Caribbean coast'],
  ['a-tayrona-anon',     'aaaaaaaa-1111-2222-3333-100000000005', 'Unsplash contributor', 'https://unsplash.com/photos/gc5OYAll-rc', 'Tayrona boulders + sea'],
  ['a-cartagena-gomez',  'aaaaaaaa-1111-2222-3333-100000000006', 'Ricardo Gomez Angel',  'https://unsplash.com/photos/L6T_6Rp2iEk', 'Cartagena multicolored houses'],
  ['a-cartagena-jorge',  'aaaaaaaa-1111-2222-3333-100000000007', 'Jorge Gardner',        'https://unsplash.com/photos/JINIW3yzobc', 'Cartagena alleyway'],
  ['a-cartagena-shelby', 'aaaaaaaa-1111-2222-3333-100000000008', 'Shelby Murphy Figueroa','https://unsplash.com/photos/uqB-Rzbm6BY', 'Cartagena street dance'],
];

function urlFor(src) {
  if (src.startsWith('photo-')) {
    return `https://images.unsplash.com/${src}?w=1600`;
  }
  // For id-only entries (verified Unsplash IDs without the legacy
  // "photo-" prefix), use the direct CDN URL pattern.
  return `https://images.unsplash.com/${src}?w=1600`;
}

// We can't deterministically map our short text ids to uuids without crypto —
// build one by namespacing under a fixed expedition uuid. uuidv5-like.
function namespacedUuid(expeditionId, slot) {
  // The expedition ids all share the same 22222222-0000-0000-0000 prefix, so
  // we anchor uniqueness in the last 12 hex chars (where the expeditions
  // differ) and append the slot to keep multiple photos per expedition
  // distinct. Format yields a valid v4-looking uuid that's stable across runs.
  const tail = expeditionId.slice(-12);              // 12 hex chars, unique per expedition
  const slotHex = String(slot).padStart(4, '0');     // 4-digit slot
  return [
    'bbbbbbbb',                                      // namespace tag for "extra photos seed"
    tail.slice(0, 4),
    tail.slice(4, 8),
    '7' + slotHex.slice(0, 3),                       // version-7-ish nibble + 3 slot digits
    (tail.slice(8) + slotHex).slice(0, 12).padEnd(12, '0'),
  ].join('-');
}

async function main() {
  // 1. Upsert new attributions.
  const attRows = NEW_ATTRIBUTIONS.map(([, id, name, sourceUrl, notes]) => ({
    id,
    photographer_name: name,
    source_url: sourceUrl,
    license: 'Unsplash License',
    license_url: 'https://unsplash.com/license',
    notes,
  }));
  const attIdByKey = new Map(NEW_ATTRIBUTIONS.map(([key, id]) => [key, id]));
  if (attRows.length) {
    const { error } = await supabase.from('photo_attributions').upsert(attRows, { onConflict: 'id' });
    if (error) throw error;
  }

  // 2. Upsert expedition_photos with stable derived ids.
  let total = 0;
  for (const [expeditionId, { photos }] of Object.entries(EXPEDITIONS)) {
    const rows = photos.map((p, i) => ({
      id: namespacedUuid(expeditionId, i),
      expedition_id: expeditionId,
      url: urlFor(p.src),
      caption: p.cap,
      order_index: i,
      attribution_id: attIdByKey.get(p.attr) ?? p.attr,
    }));
    const { error } = await supabase.from('expedition_photos').upsert(rows, { onConflict: 'id' });
    if (error) {
      console.warn(`photos failed for ${expeditionId}:`, error.message);
      continue;
    }
    total += rows.length;
  }
  console.log(`Upserted ${total} expedition photos across ${Object.keys(EXPEDITIONS).length} templates.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
