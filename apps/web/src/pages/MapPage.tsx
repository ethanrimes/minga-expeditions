import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from '@minga/theme';
import { useT } from '@minga/i18n';
import { fetchFeedExpeditions, fetchMyActivities, getSupabase } from '@minga/supabase';
import type { ExpeditionWithAuthor, DbActivity } from '@minga/types';
import { supabase } from '../supabase';
import { buildOsmStyle, COLOMBIA_BOUNDS } from '../map/style';

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
  const [expeditions, setExpeditions] = useState<ExpeditionWithAuthor[]>([]);
  const [activities, setActivities] = useState<DbActivity[]>([]);
  const [ready, setReady] = useState(false);

  // Fetch expeditions + (optional) my activities alongside one another.
  useEffect(() => {
    (async () => {
      const [exp, acts] = await Promise.all([
        fetchFeedExpeditions(supabase, { limit: 50 }).catch(() => []),
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

  // Render expedition markers whenever the list updates.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    const markers: maplibregl.Marker[] = [];

    for (const exp of expeditions) {
      if (exp.start_lat == null || exp.start_lng == null) continue;
      const el = document.createElement('button');
      el.type = 'button';
      el.setAttribute('aria-label', exp.title);
      el.style.cssText = `
        width: 28px; height: 28px; border-radius: 999px; border: 3px solid #fff;
        background: ${exp.is_official ? theme.accent : theme.primary};
        box-shadow: 0 6px 16px rgba(0,0,0,0.25); cursor: pointer;
        transition: transform 120ms ease;
      `;
      el.onmouseenter = () => (el.style.transform = 'scale(1.15)');
      el.onmouseleave = () => (el.style.transform = 'scale(1)');

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

      el.addEventListener('click', (e) => {
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

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string,
  );
}
