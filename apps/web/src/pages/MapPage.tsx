import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from '@minga/theme';
import { useT } from '@minga/i18n';
import { fetchExpeditionMarkers, fetchMyActivities, getSupabase, type ExpeditionMarker } from '@minga/supabase';
import type { DbActivity, GeoLayerId } from '@minga/types';
import { GEO_LAYERS, buildGeoTileUrl } from '@minga/types';
import { supabase } from '../supabase';
import { buildOsmStyle, COLOMBIA_BOUNDS } from '../map/style';

const env = import.meta.env as unknown as Record<string, string>;

// Colombia-centered MapLibre view with three layers:
//   1. Expedition markers (color-coded by Minga-official vs community)
//   2. GeoJSON polylines drawn from signed-in user's activity_tracks
//   3. A semi-transparent highlight polygon around Colombia for context
// Tiles: OpenStreetMap raster via the MapLibre demo tiles (no API key required).

type ActivityTrackRow = { activity_id: string; lat: number; lng: number; sequence: number };

export function MapPage() {
  const { theme } = useTheme();
  const { t } = useT();
  const nav = useNavigate();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [expeditions, setExpeditions] = useState<ExpeditionMarker[]>([]);
  const [activities, setActivities] = useState<DbActivity[]>([]);
  const [ready, setReady] = useState(false);
  const [visibleLayers, setVisibleLayers] = useState<Record<GeoLayerId, boolean>>(() =>
    Object.fromEntries(GEO_LAYERS.map((l) => [l.id, l.defaultVisible])) as Record<GeoLayerId, boolean>,
  );
  const supabaseUrl = env.VITE_SUPABASE_URL ?? '';

  // Fetch expeditions + (optional) my activities alongside one another.
  useEffect(() => {
    (async () => {
      const [exp, acts] = await Promise.all([
        // Markers need ~9 columns — skipping the photo joins + per-row
        // aggregate enrichment that `fetchFeedExpeditions` would do.
        fetchExpeditionMarkers(supabase, { limit: 200 }).catch(() => [] as ExpeditionMarker[]),
        fetchMyActivities(supabase).catch(() => []),
      ]);
      setExpeditions(exp);
      setActivities(acts);
    })();
  }, []);

  // Initialize the map once.
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: buildOsmStyle(),
      bounds: COLOMBIA_BOUNDS,
      fitBoundsOptions: { padding: 40 },
      attributionControl: { compact: true },
    });
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
    map.addControl(new maplibregl.ScaleControl({ unit: 'metric' }), 'bottom-left');
    map.on('load', () => setReady(true));
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Geo reference overlays (PNN, páramos, glaciers, biomes, admin levels…).
  // Add every layer once with its initial visibility; a second effect below
  // mutates visibility without tearing down sources.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready || !supabaseUrl) return;
    for (const def of GEO_LAYERS) {
      const sourceId = `geo-${def.id}`;
      if (map.getSource(sourceId)) continue;
      map.addSource(sourceId, {
        type: 'vector',
        tiles: [buildGeoTileUrl(supabaseUrl, def.id)],
        minzoom: def.minzoom,
        maxzoom: def.maxzoom,
      });
      const visible = visibleLayers[def.id];
      def.styles.forEach((s, i) => {
        map.addLayer({
          id: `geo-${def.id}-${i}`,
          type: s.type,
          source: sourceId,
          'source-layer': def.id,
          minzoom: def.minzoom,
          paint: s.paint as any,
          layout: {
            visibility: visible ? 'visible' : 'none',
            ...(s.layout as any ?? {}),
          },
        } as any);
      });
    }
    // Sources/layers stay attached for the lifetime of the map; cleanup happens
    // in the map.remove() teardown in the init effect above.
  }, [ready, supabaseUrl]);

  // Mirror visibleLayers state into MapLibre layer visibility.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    for (const def of GEO_LAYERS) {
      const visible = visibleLayers[def.id];
      def.styles.forEach((_, i) => {
        const id = `geo-${def.id}-${i}`;
        if (map.getLayer(id)) map.setLayoutProperty(id, 'visibility', visible ? 'visible' : 'none');
      });
    }
  }, [visibleLayers, ready]);

  // Render expedition markers whenever the list updates.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    const markers: maplibregl.Marker[] = [];

    for (const exp of expeditions) {
      if (exp.start_lat == null || exp.start_lng == null) continue;
      // Wrap the button in an outer div: MapLibre writes its positioning
      // transform onto the marker root element, so the hover scale must live
      // on an inner node or the dot snaps to the top-left corner.
      const el = document.createElement('div');
      el.style.cssText = 'width: 28px; height: 28px;';
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.setAttribute('aria-label', exp.title);
      btn.style.cssText = `
        width: 28px; height: 28px; border-radius: 999px; border: 3px solid #fff;
        background: ${exp.is_official ? theme.accent : theme.primary};
        box-shadow: 0 6px 16px rgba(0,0,0,0.25); cursor: pointer;
        padding: 0; display: block;
        transition: transform 120ms ease;
      `;
      btn.onmouseenter = () => (btn.style.transform = 'scale(1.15)');
      btn.onmouseleave = () => (btn.style.transform = 'scale(1)');
      el.appendChild(btn);

      const popup = new maplibregl.Popup({ offset: 18, closeButton: false }).setHTML(`
        <div style="font-family: Nunito, sans-serif; min-width: 200px;">
          <div style="font-weight: 800; font-size: 14px; color: ${theme.text}; margin-bottom: 4px;">
            ${escapeHtml(exp.title)}
          </div>
          <div style="color: ${theme.textMuted}; font-size: 12px; margin-bottom: 6px;">
            ${escapeHtml(exp.location_name)}
            ${exp.region ? ', ' + escapeHtml(exp.region) : ''}
          </div>
          <div style="color: ${theme.primary}; font-weight: 700; font-size: 12px;">
            ${t('detail.back').replace('← ', '')} · ${exp.category}
          </div>
        </div>
      `);

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([exp.start_lng, exp.start_lat])
        .setPopup(popup)
        .addTo(map);

      btn.addEventListener('click', (e) => {
        // Left-click opens detail page; the popup still shows on right-click/drag.
        e.stopPropagation();
        nav(`/expeditions/${exp.id}`);
      });

      markers.push(marker);
    }
    return () => {
      for (const m of markers) m.remove();
    };
  }, [expeditions, ready, theme, t, nav]);

  // Render my tracked activities as orange polylines.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready || activities.length === 0) return;
    const trackSourceId = 'my-tracks';
    const trackLayerId = 'my-tracks-line';

    let cancelled = false;
    (async () => {
      // Fetch track points for the most recent 10 activities.
      const ids = activities.slice(0, 10).map((a) => a.id);
      if (ids.length === 0) return;
      const { data } = await getSupabase()
        .from('activity_tracks')
        .select('activity_id, lat, lng, sequence')
        .in('activity_id', ids)
        .order('sequence', { ascending: true });
      if (cancelled || !data) return;

      const rows = data as ActivityTrackRow[];
      const byActivity = new Map<string, [number, number][]>();
      for (const r of rows) {
        if (!byActivity.has(r.activity_id)) byActivity.set(r.activity_id, []);
        byActivity.get(r.activity_id)!.push([r.lng, r.lat]);
      }
      const features = Array.from(byActivity.values())
        .filter((coords) => coords.length >= 2)
        .map((coords) => ({
          type: 'Feature' as const,
          geometry: { type: 'LineString' as const, coordinates: coords },
          properties: {},
        }));

      if (features.length === 0) return;

      const geo = { type: 'FeatureCollection' as const, features };
      if (map.getSource(trackSourceId)) {
        (map.getSource(trackSourceId) as maplibregl.GeoJSONSource).setData(geo);
      } else {
        map.addSource(trackSourceId, { type: 'geojson', data: geo });
        map.addLayer({
          id: `${trackLayerId}-halo`,
          type: 'line',
          source: trackSourceId,
          paint: { 'line-color': '#ffffff', 'line-width': 8, 'line-opacity': 0.9 },
          layout: { 'line-cap': 'round', 'line-join': 'round' },
        });
        map.addLayer({
          id: trackLayerId,
          type: 'line',
          source: trackSourceId,
          paint: { 'line-color': theme.primary, 'line-width': 5, 'line-opacity': 1 },
          layout: { 'line-cap': 'round', 'line-join': 'round' },
        });
      }

      // Auto-fit to the combined track bounds so the routes are visible.
      const b = new maplibregl.LngLatBounds();
      for (const f of features) {
        for (const c of f.geometry.coordinates) b.extend(c as [number, number]);
      }
      if (!b.isEmpty()) {
        map.fitBounds(b, { padding: 80, maxZoom: 13, duration: 800 });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [activities, ready, theme.primary]);

  return (
    <div style={{ padding: '24px', maxWidth: 1400, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ color: theme.primary, fontWeight: 800, fontSize: 13, letterSpacing: 2 }}>
            {t('map.title').toUpperCase()}
          </div>
          <h1 style={{ margin: '4px 0 4px 0', color: theme.text, fontSize: 36, fontWeight: 800 }}>{t('map.title')}</h1>
          <p style={{ color: theme.textMuted, margin: 0 }}>{t('map.subtitle')}</p>
        </div>
        <Legend theme={theme} t={t} />
      </div>

      <GeoLayerChips
        theme={theme}
        visible={visibleLayers}
        onToggle={(id) => setVisibleLayers((p) => ({ ...p, [id]: !p[id] }))}
      />

      <div
        ref={containerRef}
        style={{
          width: '100%',
          height: '70vh',
          minHeight: 480,
          borderRadius: 16,
          overflow: 'hidden',
          border: `1px solid ${theme.border}`,
          background: theme.surfaceAlt,
        }}
      />

      <div style={{ display: 'flex', gap: 12, marginTop: 16, flexWrap: 'wrap' }}>
        <Link
          to="/expeditions"
          style={{
            background: theme.surfaceAlt,
            color: theme.text,
            border: `1px solid ${theme.border}`,
            padding: '10px 18px',
            borderRadius: 999,
            fontWeight: 700,
          }}
        >
          {t('nav.expeditions')}
        </Link>
        <Link
          to="/track"
          style={{
            background: theme.primary,
            color: theme.onPrimary,
            padding: '10px 18px',
            borderRadius: 999,
            fontWeight: 700,
          }}
        >
          {t('nav.track')}
        </Link>
      </div>
    </div>
  );
}

function Legend({ theme, t }: { theme: any; t: (k: any) => string }) {
  const Item = ({ color, label }: { color: string; label: string }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ width: 14, height: 14, borderRadius: 999, background: color, border: '2px solid #fff', boxShadow: '0 2px 6px rgba(0,0,0,0.2)' }} />
      <span style={{ color: theme.text, fontSize: 13, fontWeight: 600 }}>{label}</span>
    </div>
  );
  return (
    <div
      style={{
        display: 'flex',
        gap: 18,
        flexWrap: 'wrap',
        background: theme.surface,
        border: `1px solid ${theme.border}`,
        borderRadius: 12,
        padding: '10px 14px',
      }}
    >
      <Item color={theme.accent} label={t('map.legendOfficial')} />
      <Item color={theme.primary} label={t('map.legendUser')} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ width: 24, height: 4, background: theme.primary, borderRadius: 2 }} />
        <span style={{ color: theme.text, fontSize: 13, fontWeight: 600 }}>{t('map.legendMyTrack')}</span>
      </div>
    </div>
  );
}

function GeoLayerChips({
  theme,
  visible,
  onToggle,
}: {
  theme: any;
  visible: Record<GeoLayerId, boolean>;
  onToggle: (id: GeoLayerId) => void;
}) {
  return (
    <div
      style={{
        display: 'flex',
        gap: 8,
        flexWrap: 'wrap',
        margin: '12px 0 12px 0',
        padding: '10px 14px',
        background: theme.surface,
        border: `1px solid ${theme.border}`,
        borderRadius: 12,
        alignItems: 'center',
      }}
    >
      <span style={{ color: theme.textMuted, fontSize: 11, fontWeight: 700, letterSpacing: 1, marginRight: 4 }}>
        CAPAS
      </span>
      {GEO_LAYERS.map((def) => {
        const on = visible[def.id];
        const fillStyle = def.styles.find((s) => s.type === 'fill');
        const lineStyle = def.styles.find((s) => s.type === 'line');
        const swatch =
          (fillStyle?.paint as any)?.['fill-color'] ||
          (lineStyle?.paint as any)?.['line-color'] ||
          theme.primary;
        return (
          <button
            key={def.id}
            type="button"
            onClick={() => onToggle(def.id)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 12px',
              borderRadius: 999,
              border: `1px solid ${on ? swatch : theme.border}`,
              background: on ? swatch + '22' : 'transparent',
              color: theme.text,
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              opacity: on ? 1 : 0.7,
            }}
          >
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: 2,
                background: swatch,
                opacity: on ? 1 : 0.4,
              }}
            />
            {def.label}
          </button>
        );
      })}
    </div>
  );
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string,
  );
}
