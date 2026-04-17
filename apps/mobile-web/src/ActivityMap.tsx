import React, { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { ActivityMapProps } from '@minga/ui';
import { buildOsmStyle, COLOMBIA_BOUNDS } from './mapStyle';

// MapLibre-backed single-activity map for the browser phone-shell.
// Shows only the polyline (no expedition markers) and auto-fits it.
export function ActivityMap({ track, primary, surfaceAlt, border, loadingLabel }: ActivityMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: buildOsmStyle(),
      bounds: COLOMBIA_BOUNDS,
      fitBoundsOptions: { padding: 20 },
      attributionControl: { compact: true },
    });
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || track.length < 2) return;

    const draw = () => {
      const data = {
        type: 'FeatureCollection' as const,
        features: [
          {
            type: 'Feature' as const,
            geometry: { type: 'LineString' as const, coordinates: track },
            properties: {},
          },
        ],
      };
      const src = 'activity-track';
      if (map.getSource(src)) {
        (map.getSource(src) as maplibregl.GeoJSONSource).setData(data);
      } else {
        map.addSource(src, { type: 'geojson', data });
        map.addLayer({
          id: `${src}-halo`,
          type: 'line',
          source: src,
          paint: { 'line-color': '#ffffff', 'line-width': 7, 'line-opacity': 0.9 },
          layout: { 'line-cap': 'round', 'line-join': 'round' },
        });
        map.addLayer({
          id: `${src}-line`,
          type: 'line',
          source: src,
          paint: { 'line-color': primary, 'line-width': 4, 'line-opacity': 1 },
          layout: { 'line-cap': 'round', 'line-join': 'round' },
        });
      }
      const b = new maplibregl.LngLatBounds();
      for (const c of track) b.extend(c as [number, number]);
      if (!b.isEmpty()) map.fitBounds(b, { padding: 30, maxZoom: 15, duration: 600 });
    };

    if (map.isStyleLoaded()) draw();
    else map.once('load', draw);
  }, [track, primary]);

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: surfaceAlt,
        border: `1px solid ${border}`,
      }}
      aria-label={loadingLabel}
    />
  );
}
