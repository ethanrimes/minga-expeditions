// Generates a 1080x1920 share card SVG for an activity. The SVG plots the
// recorded GPS track over a transparent canvas, overlays the title +
// distance/elevation/duration, and is suitable for posting to WhatsApp /
// Instagram stories.
//
// We return SVG (text) rather than PNG because:
//   - Deno + image-rasterization deps are heavyweight in Edge Functions.
//   - The mobile + web clients can rasterize via react-native-view-shot or a
//     <canvas> on web, which is faster and lets us tweak styles client-side.
//
// PNG conversion is a candidate follow-up — drop satori + resvg-wasm in here
// and switch the Content-Type to image/png.
//
// Request: GET /activity-share-card?activity_id=<uuid>
// Response: image/svg+xml

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';
import { corsHeaders } from '../_shared/cors.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

interface Activity {
  id: string;
  title: string;
  activity_type: string;
  distance_km: number;
  elevation_gain_m: number;
  duration_seconds: number;
  user_id: string;
}

const W = 1080;
const H = 1920;
const PAD = 80;
const ROUTE_BOX_TOP = 360;
const ROUTE_BOX_BOTTOM = 1280;

function fmtDistance(km: number): string {
  return `${km.toFixed(km < 10 ? 2 : 1)} km`;
}
function fmtDuration(s: number): string {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}
function fmtElev(m: number): string {
  return `${Math.round(m)} m`;
}
function escapeXml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[c]!));
}

function pathFromTrack(track: { lat: number; lng: number }[]): string {
  if (track.length === 0) return '';

  let minLat = Infinity, maxLat = -Infinity, minLng = Infinity, maxLng = -Infinity;
  for (const p of track) {
    if (p.lat < minLat) minLat = p.lat;
    if (p.lat > maxLat) maxLat = p.lat;
    if (p.lng < minLng) minLng = p.lng;
    if (p.lng > maxLng) maxLng = p.lng;
  }

  const w = W - PAD * 2;
  const h = ROUTE_BOX_BOTTOM - ROUTE_BOX_TOP;
  const dLat = Math.max(maxLat - minLat, 1e-6);
  const dLng = Math.max(maxLng - minLng, 1e-6);
  const aspect = dLng / dLat;
  const targetAspect = w / h;
  const scale = aspect > targetAspect ? w / dLng : h / dLat;
  const offsetX = (w - dLng * scale) / 2;
  const offsetY = (h - dLat * scale) / 2;

  return track
    .map((p, i) => {
      const x = PAD + offsetX + (p.lng - minLng) * scale;
      // SVG y grows downward; latitude grows upward, so invert.
      const y = ROUTE_BOX_TOP + offsetY + (maxLat - p.lat) * scale;
      return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(' ');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const url = new URL(req.url);
  const activityId = url.searchParams.get('activity_id');
  if (!activityId) {
    return new Response('activity_id required', { status: 400, headers: corsHeaders });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const [{ data: activity }, { data: track }] = await Promise.all([
    supabase
      .from('activities')
      .select('id, title, activity_type, distance_km, elevation_gain_m, duration_seconds, user_id')
      .eq('id', activityId)
      .maybeSingle(),
    supabase
      .from('activity_tracks')
      .select('lat, lng, sequence')
      .eq('activity_id', activityId)
      .order('sequence', { ascending: true }),
  ]);

  if (!activity) {
    return new Response('not found', { status: 404, headers: corsHeaders });
  }

  const a = activity as Activity;
  const path = pathFromTrack((track ?? []) as { lat: number; lng: number }[]);

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#0E1116"/>
      <stop offset="1" stop-color="#2A1A04"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <text x="${PAD}" y="${PAD + 30}" font-family="ui-sans-serif, system-ui" font-size="32" font-weight="700" fill="#ED8B00" letter-spacing="6">MINGA</text>
  <text x="${PAD}" y="${PAD + 90}" font-family="ui-sans-serif, system-ui" font-size="18" fill="#9AA1AE" letter-spacing="3">EXPEDITIONS</text>
  <text x="${PAD}" y="${PAD + 200}" font-family="ui-sans-serif, system-ui" font-size="68" font-weight="800" fill="#FFFFFF">
    ${escapeXml(a.title)}
  </text>
  <text x="${PAD}" y="${PAD + 250}" font-family="ui-sans-serif, system-ui" font-size="28" fill="#FFE3B8" text-transform="uppercase">
    ${escapeXml(a.activity_type)}
  </text>
  ${
    path
      ? `<path d="${path}" stroke="#FFFFFF" stroke-width="14" stroke-linejoin="round" stroke-linecap="round" fill="none" opacity="0.35"/>
         <path d="${path}" stroke="#ED8B00" stroke-width="8" stroke-linejoin="round" stroke-linecap="round" fill="none"/>`
      : `<text x="${W / 2}" y="${(ROUTE_BOX_TOP + ROUTE_BOX_BOTTOM) / 2}" text-anchor="middle" font-family="ui-sans-serif, system-ui" font-size="32" fill="#5B6271">No route data</text>`
  }
  <g font-family="ui-sans-serif, system-ui" fill="#FFFFFF">
    <text x="${PAD}" y="${ROUTE_BOX_BOTTOM + 130}" font-size="86" font-weight="800">${fmtDistance(a.distance_km)}</text>
    <text x="${PAD}" y="${ROUTE_BOX_BOTTOM + 175}" font-size="22" fill="#9AA1AE" letter-spacing="3">DISTANCE</text>

    <text x="${W / 2}" y="${ROUTE_BOX_BOTTOM + 130}" font-size="86" font-weight="800">${fmtDuration(a.duration_seconds)}</text>
    <text x="${W / 2}" y="${ROUTE_BOX_BOTTOM + 175}" font-size="22" fill="#9AA1AE" letter-spacing="3">TIME</text>

    <text x="${PAD}" y="${ROUTE_BOX_BOTTOM + 290}" font-size="86" font-weight="800">${fmtElev(a.elevation_gain_m)}</text>
    <text x="${PAD}" y="${ROUTE_BOX_BOTTOM + 335}" font-size="22" fill="#9AA1AE" letter-spacing="3">ELEVATION</text>
  </g>
  <text x="${W / 2}" y="${H - 60}" font-family="ui-sans-serif, system-ui" font-size="22" fill="#5B6271" text-anchor="middle">
    minga.co
  </text>
</svg>`;

  return new Response(svg, {
    headers: {
      ...corsHeaders,
      'Content-Type': 'image/svg+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
    },
  });
});
