// Serves Mapbox Vector Tiles for the geo_* reference layers populated by
// scripts/geo/load.mjs (see 20260511000700_postgis_geo_enrichment.sql).
//
// URL shape:  /geo-tile/<layer>/<z>/<x>/<y>.mvt
// Allowed layers come from a server-side allow-list; per-layer minimum zooms
// are enforced inside the public.geo_tile() Postgres function (returns NULL
// → we send an empty 204).
//
// This function is public (no JWT). Add to supabase/config.toml:
//   [functions.geo-tile]
//   verify_jwt = false
//
// CDN-cacheable: a tile for one (layer, z, x, y) is the same for every
// caller, so we set immutable long-max-age caching.

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const ALLOWED_LAYERS = new Set([
  'departamentos',
  'municipios',
  'veredas',
  'biomas',
  'areas_protegidas',
  'paramos',
  'glaciares',
]);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
};

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// PostgREST returns bytea as either '\xDEADBEEF…' hex (PostgREST ≤11) or a
// base64 string (PostgREST ≥12). Handle both.
function decodeBytea(value: unknown): Uint8Array {
  if (value == null) return new Uint8Array(0);
  if (value instanceof Uint8Array) return value;
  if (typeof value === 'string') {
    if (value.startsWith('\\x')) {
      const hex = value.slice(2);
      const out = new Uint8Array(hex.length / 2);
      for (let i = 0; i < hex.length; i += 2) {
        out[i / 2] = parseInt(hex.slice(i, i + 2), 16);
      }
      return out;
    }
    // base64
    const bin = atob(value);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }
  return new Uint8Array(0);
}

const ROUTE = /\/geo-tile\/([a-z_]+)\/(\d{1,2})\/(\d{1,9})\/(\d{1,9})(?:\.mvt)?$/;

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  if (req.method !== 'GET') return new Response('method not allowed', { status: 405, headers: corsHeaders });

  const url = new URL(req.url);
  const match = url.pathname.match(ROUTE);
  if (!match) return new Response('not found', { status: 404, headers: corsHeaders });

  const [, layer, zStr, xStr, yStr] = match;
  if (!ALLOWED_LAYERS.has(layer)) {
    return new Response('unknown layer', { status: 400, headers: corsHeaders });
  }
  const z = parseInt(zStr, 10);
  const x = parseInt(xStr, 10);
  const y = parseInt(yStr, 10);
  if (z < 0 || z > 22 || x < 0 || y < 0 || x >= 1 << z || y >= 1 << z) {
    return new Response('bad tile coords', { status: 400, headers: corsHeaders });
  }

  const { data, error } = await supabase.rpc('geo_tile', {
    p_layer: layer,
    p_z: z,
    p_x: x,
    p_y: y,
  });

  if (error) {
    console.error('geo_tile rpc error', error);
    return new Response(`db error: ${error.message}`, { status: 500, headers: corsHeaders });
  }

  const bytes = decodeBytea(data);

  // Empty tile (out of zoom range / no features) → 204 so MapLibre stops asking.
  if (bytes.byteLength === 0) {
    return new Response(null, {
      status: 204,
      headers: {
        ...corsHeaders,
        'Cache-Control': 'public, max-age=86400, s-maxage=86400, immutable',
      },
    });
  }

  return new Response(bytes, {
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/vnd.mapbox-vector-tile',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400, immutable',
    },
  });
});
