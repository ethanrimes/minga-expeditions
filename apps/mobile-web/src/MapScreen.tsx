import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useTheme } from '@minga/theme';
import { useT } from '@minga/i18n';
import { fetchExpeditionMarkers, fetchMyActivities, getSupabase, type ExpeditionMarker } from '@minga/supabase';
import type { DbActivity, GeoLayerId } from '@minga/types';
import { GEO_LAYERS, buildGeoTileUrl } from '@minga/types';
import { buildOsmStyle, COLOMBIA_BOUNDS } from './mapStyle';

const env = import.meta.env as unknown as Record<string, string>;

// Phone-shell friendly MapLibre viewport — deliberately uses DOM directly
// (not react-native-web primitives) because MapLibre GL JS owns its own DOM
// subtree. Fits inside the MobileShell's content area.
export function MapScreen({ onOpenExpedition }: { onOpenExpedition: (id: string) => void }) {
  const { theme } = useTheme();
  const { t } = useT();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [expeditions, setExpeditions] = useState<ExpeditionMarker[]>([]);
  const [activities, setActivities] = useState<DbActivity[]>([]);
  const [ready, setReady] = useState(false);
  const [visibleLayers, setVisibleLayers] = useState<Record<GeoLayerId, boolean>>(() =>
    Object.fromEntries(GEO_LAYERS.map((l) => [l.id, l.defaultVisible])) as Record<GeoLayerId, boolean>,
  );
  const supabaseUrl = env.VITE_SUPABASE_URL ?? '';

  useEffect(() => {
    (async () => {
      const [exp, acts] = await Promise.all([
        fetchExpeditionMarkers(getSupabase(), { limit: 200 }).catch(() => [] as ExpeditionMarker[]),
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

  // Geo reference overlays. Add once with initial visibility; second effect
  // toggles visibility without tearing down sources.
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
  }, [ready, supabaseUrl]);

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
      <div ref={containerRef} style={{ flex: 1, margin: '0 16px 8px', borderRadius: 14, overflow: 'hidden', border: `1px solid ${theme.border}` }} />
      <GeoLayerChips
        theme={theme}
        visible={visibleLayers}
        onToggle={(id) => setVisibleLayers((p) => ({ ...p, [id]: !p[id] }))}
      />
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
        gap: 6,
        flexWrap: 'wrap',
        padding: '0 16px 8px',
        overflowX: 'auto',
      }}
    >
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
              gap: 5,
              padding: '4px 10px',
              borderRadius: 999,
              border: `1px solid ${on ? swatch : theme.border}`,
              background: on ? swatch + '22' : 'transparent',
              color: theme.text,
              fontSize: 11,
              fontWeight: 700,
              cursor: 'pointer',
              opacity: on ? 1 : 0.7,
              whiteSpace: 'nowrap',
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
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

function LegendDot({ color, label, theme }: { color: string; label: string; theme: any }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <span style={{ width: 12, height: 12, borderRadius: 999, background: color, border: '2px solid #fff', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }} />
      <span style={{ color: theme.text, fontWeight: 700 }}>{label}</span>
    </div>
  );
}
