import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useTheme } from '@minga/theme';
import { useT } from '@minga/i18n';
import { fetchFeedExpeditions, fetchMyActivities, getSupabase } from '@minga/supabase';
import type { ExpeditionWithAuthor, DbActivity } from '@minga/types';
import { buildOsmStyle, COLOMBIA_BOUNDS } from './mapStyle';

// Phone-shell friendly MapLibre viewport — deliberately uses DOM directly
// (not react-native-web primitives) because MapLibre GL JS owns its own DOM
// subtree. Fits inside the MobileShell's content area.
export function MapScreen({ onOpenExpedition }: { onOpenExpedition: (id: string) => void }) {
  const { theme } = useTheme();
  const { t } = useT();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [expeditions, setExpeditions] = useState<ExpeditionWithAuthor[]>([]);
  const [activities, setActivities] = useState<DbActivity[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      const [exp, acts] = await Promise.all([
        fetchFeedExpeditions(getSupabase(), { limit: 50 }).catch(() => []),
        fetchMyActivities(getSupabase()).catch(() => []),
      ]);
      setExpeditions(exp);
      setActivities(acts);
    })();
  }, []);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: buildOsmStyle(),
      bounds: COLOMBIA_BOUNDS,
      fitBoundsOptions: { padding: 20 },
      attributionControl: { compact: true },
    });
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
    map.on('load', () => setReady(true));
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    const markers: maplibregl.Marker[] = [];

    for (const exp of expeditions) {
      if (exp.start_lat == null || exp.start_lng == null) continue;
      const el = document.createElement('button');
      el.type = 'button';
      el.style.cssText = `
        width: 22px; height: 22px; border-radius: 999px; border: 2px solid #fff;
        background: ${exp.is_official ? theme.accent : theme.primary};
        box-shadow: 0 3px 10px rgba(0,0,0,0.25); cursor: pointer;
      `;
      el.onclick = () => onOpenExpedition(exp.id);
      markers.push(
        new maplibregl.Marker({ element: el }).setLngLat([exp.start_lng, exp.start_lat]).addTo(map),
      );
    }
    return () => markers.forEach((m) => m.remove());
  }, [expeditions, ready, theme, onOpenExpedition]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready || activities.length === 0) return;
    const srcId = 'my-tracks';
    const layerId = 'my-tracks-line';
    let cancelled = false;

    (async () => {
      const ids = activities.slice(0, 10).map((a) => a.id);
      const { data } = await getSupabase()
        .from('activity_tracks')
        .select('activity_id, lat, lng, sequence')
        .in('activity_id', ids)
        .order('sequence', { ascending: true });
      if (cancelled || !data) return;

      const byActivity = new Map<string, [number, number][]>();
      for (const r of data as { activity_id: string; lat: number; lng: number; sequence: number }[]) {
        if (!byActivity.has(r.activity_id)) byActivity.set(r.activity_id, []);
        byActivity.get(r.activity_id)!.push([r.lng, r.lat]);
      }
      const features = Array.from(byActivity.values())
        .filter((c) => c.length >= 2)
        .map((c) => ({
          type: 'Feature' as const,
          geometry: { type: 'LineString' as const, coordinates: c },
          properties: {},
        }));
      if (!features.length) return;

      const geo = { type: 'FeatureCollection' as const, features };
      if (map.getSource(srcId)) {
        (map.getSource(srcId) as maplibregl.GeoJSONSource).setData(geo);
      } else {
        map.addSource(srcId, { type: 'geojson', data: geo });
        map.addLayer({
          id: `${layerId}-halo`,
          type: 'line',
          source: srcId,
          paint: { 'line-color': '#ffffff', 'line-width': 7, 'line-opacity': 0.9 },
          layout: { 'line-cap': 'round', 'line-join': 'round' },
        });
        map.addLayer({
          id: layerId,
          type: 'line',
          source: srcId,
          paint: { 'line-color': theme.primary, 'line-width': 4, 'line-opacity': 1 },
          layout: { 'line-cap': 'round', 'line-join': 'round' },
        });
      }

      const b = new maplibregl.LngLatBounds();
      for (const f of features) {
        for (const c of f.geometry.coordinates) b.extend(c as [number, number]);
      }
      if (!b.isEmpty()) map.fitBounds(b, { padding: 40, maxZoom: 13, duration: 800 });
    })();

    return () => {
      cancelled = true;
    };
  }, [activities, ready, theme.primary]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: theme.background,
      }}
    >
      <div style={{ padding: '16px 16px 8px' }}>
        <div style={{ color: theme.primary, fontWeight: 700, fontSize: 11, letterSpacing: 2 }}>
          {t('map.title').toUpperCase()}
        </div>
        <div style={{ color: theme.text, fontWeight: 800, fontSize: 22, marginTop: 2 }}>{t('map.title')}</div>
        <div style={{ color: theme.textMuted, fontSize: 12, marginTop: 2 }}>{t('map.subtitle')}</div>
      </div>
      <div ref={containerRef} style={{ flex: 1, margin: '0 16px 16px', borderRadius: 14, overflow: 'hidden', border: `1px solid ${theme.border}` }} />
      <div style={{ display: 'flex', gap: 10, padding: '0 16px 16px', fontSize: 11, color: theme.text, flexWrap: 'wrap' }}>
        <LegendDot color={theme.accent} label={t('map.legendOfficial')} theme={theme} />
        <LegendDot color={theme.primary} label={t('map.legendUser')} theme={theme} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 18, height: 3, background: theme.primary, borderRadius: 2 }} />
          <span style={{ fontWeight: 700 }}>{t('map.legendMyTrack')}</span>
        </div>
      </div>
    </div>
  );
}

function LegendDot({ color, label, theme }: { color: string; label: string; theme: any }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <span style={{ width: 12, height: 12, borderRadius: 999, background: color, border: '2px solid #fff', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }} />
      <span style={{ color: theme.text, fontWeight: 700 }}>{label}</span>
    </div>
  );
}
