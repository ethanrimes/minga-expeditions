import type { ExpeditionWithAuthor, DbActivity, GeoLayerDef } from '@minga/types';

// Builds a self-contained HTML document that:
//  - loads MapLibre GL JS from a CDN
//  - fits Colombia on boot
//  - renders expedition markers + activity-track polylines from data baked into
//    the HTML at render time
//  - attaches the geo_* reference layers (PNN, páramos, glaciers, biomes,
//    admin levels…) as MVT vector sources via the Supabase geo-tile Edge fn
//  - renders a horizontally-scrollable chip row for toggling layers
//  - posts { type: 'openExpedition', id } back to React Native when a marker
//    is tapped, via `window.ReactNativeWebView.postMessage`
//
// WebView keeps us in Expo Go (no custom dev client required) while still
// rendering the real MapLibre GL engine on-device.

export interface MapPayload {
  expeditions: ExpeditionWithAuthor[];
  activities: DbActivity[];
  tracks: Record<string, [number, number][]>; // activityId → [lng, lat][]
  primary: string;
  accent: string;
  text: string;
  muted: string;
  border: string;
  surface: string;
  surfaceAlt: string;
  background: string;
  /** Base URL like https://abc123.supabase.co — no trailing slash needed. */
  supabaseUrl: string;
  /** Same GEO_LAYERS list shipped from @minga/types. */
  geoLayers: GeoLayerDef[];
  labels: {
    legendOfficial: string;
    legendUser: string;
    legendMyTrack: string;
    loading: string;
  };
}

export function buildMapHtml(p: MapPayload): string {
  // JSON.stringify, then neutralize any `</script>` inside user-supplied strings.
  const data = JSON.stringify(p).replace(/</g, '\\u003C');

  return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
  <title>Minga Map</title>
  <link rel="stylesheet" href="https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.css" />
  <style>
    html, body { margin: 0; padding: 0; height: 100%; width: 100%; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: ${p.background}; display: flex; flex-direction: column; }
    #map { flex: 1; }
    .minga-marker {
      width: 22px; height: 22px; border-radius: 999px; border: 2px solid #fff;
      box-shadow: 0 3px 10px rgba(0,0,0,0.25); cursor: pointer; display: block;
    }
    .minga-marker.official { background: ${p.accent}; }
    .minga-marker.user     { background: ${p.primary}; }
    .legend {
      position: absolute; bottom: 12px; left: 12px; right: 12px;
      background: ${p.surface}; color: ${p.text};
      border: 1px solid ${p.border}; border-radius: 10px;
      padding: 8px 12px; display: flex; gap: 14px; flex-wrap: wrap;
      font-size: 12px; font-weight: 700; z-index: 2;
    }
    .legend .dot { display: inline-block; width: 12px; height: 12px; border-radius: 999px; vertical-align: middle; margin-right: 6px; border: 2px solid #fff; box-shadow: 0 2px 4px rgba(0,0,0,0.2); }
    .legend .bar { display: inline-block; width: 18px; height: 3px; border-radius: 2px; vertical-align: middle; margin-right: 6px; }
    .layer-chips {
      position: absolute; top: 12px; left: 12px; right: 12px;
      display: flex; gap: 6px; overflow-x: auto; padding: 4px 0;
      z-index: 2; -webkit-overflow-scrolling: touch; scrollbar-width: none;
    }
    .layer-chips::-webkit-scrollbar { display: none; }
    .layer-chip {
      flex: 0 0 auto; display: inline-flex; align-items: center; gap: 5px;
      padding: 5px 10px; border-radius: 999px;
      border: 1px solid ${p.border}; background: ${p.surface};
      color: ${p.text}; font-size: 11px; font-weight: 700;
      white-space: nowrap; cursor: pointer;
    }
    .layer-chip.on { opacity: 1; }
    .layer-chip.off { opacity: 0.55; }
    .layer-chip .swatch { width: 8px; height: 8px; border-radius: 2px; }
    .loading {
      position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
      background: ${p.surfaceAlt}; color: ${p.muted};
      font-weight: 700; letter-spacing: 0.5px; z-index: 3;
      transition: opacity 200ms ease;
    }
    .loading.hidden { opacity: 0; pointer-events: none; }
  </style>
</head>
<body>
  <div id="map"></div>
  <div class="loading" id="loading">${escapeHtml(p.labels.loading)}</div>
  <div class="layer-chips" id="layer-chips"></div>
  <div class="legend">
    <span><span class="dot" style="background:${p.accent}"></span>${escapeHtml(p.labels.legendOfficial)}</span>
    <span><span class="dot" style="background:${p.primary}"></span>${escapeHtml(p.labels.legendUser)}</span>
    <span><span class="bar" style="background:${p.primary}"></span>${escapeHtml(p.labels.legendMyTrack)}</span>
  </div>

  <script src="https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.js"></script>
  <script>
    (function () {
      var post = function (msg) {
        if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
          window.ReactNativeWebView.postMessage(JSON.stringify(msg));
        }
      };
      var initial = ${data};

      var map = new maplibregl.Map({
        container: 'map',
        style: {
          version: 8,
          sources: {
            osm: {
              type: 'raster',
              tiles: [
                'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
                'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
                'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png'
              ],
              tileSize: 256,
              attribution: '© OpenStreetMap contributors'
            }
          },
          layers: [{ id: 'osm', type: 'raster', source: 'osm', minzoom: 0, maxzoom: 19 }]
        },
        bounds: [[-79, -4.5], [-66.8, 13.5]],
        fitBoundsOptions: { padding: 24 }
      });
      map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');

      function buildTileUrl(layerId) {
        var base = (initial.supabaseUrl || '').replace(/\\/+$/, '');
        return base + '/functions/v1/geo-tile/' + layerId + '/{z}/{x}/{y}.mvt';
      }

      function setLayerVisible(def, visible) {
        for (var i = 0; i < def.styles.length; i++) {
          var id = 'geo-' + def.id + '-' + i;
          if (map.getLayer(id)) map.setLayoutProperty(id, 'visibility', visible ? 'visible' : 'none');
        }
      }

      function attachGeoLayers() {
        if (!initial.supabaseUrl) return;
        (initial.geoLayers || []).forEach(function (def) {
          var sourceId = 'geo-' + def.id;
          if (map.getSource(sourceId)) return;
          map.addSource(sourceId, {
            type: 'vector',
            tiles: [buildTileUrl(def.id)],
            minzoom: def.minzoom,
            maxzoom: def.maxzoom
          });
          (def.styles || []).forEach(function (s, i) {
            map.addLayer({
              id: 'geo-' + def.id + '-' + i,
              type: s.type,
              source: sourceId,
              'source-layer': def.id,
              minzoom: def.minzoom,
              paint: s.paint,
              layout: Object.assign({ visibility: def.defaultVisible ? 'visible' : 'none' }, s.layout || {})
            });
          });
        });
      }

      function renderChips() {
        var host = document.getElementById('layer-chips');
        if (!host) return;
        host.innerHTML = '';
        (initial.geoLayers || []).forEach(function (def) {
          var fill = (def.styles || []).find(function (s) { return s.type === 'fill'; });
          var line = (def.styles || []).find(function (s) { return s.type === 'line'; });
          var swatch =
            (fill && fill.paint && fill.paint['fill-color']) ||
            (line && line.paint && line.paint['line-color']) ||
            initial.primary;
          var on = !!def.defaultVisible;
          var btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'layer-chip ' + (on ? 'on' : 'off');
          btn.style.borderColor = on ? swatch : initial.border;
          btn.innerHTML = '<span class="swatch" style="background:' + swatch + '"></span>' + escapeText(def.label);
          btn.addEventListener('click', function () {
            on = !on;
            btn.className = 'layer-chip ' + (on ? 'on' : 'off');
            btn.style.borderColor = on ? swatch : initial.border;
            setLayerVisible(def, on);
          });
          host.appendChild(btn);
        });
      }

      function escapeText(s) {
        var div = document.createElement('div');
        div.textContent = s == null ? '' : String(s);
        return div.innerHTML;
      }

      function renderMarkers(list) {
        (list || []).forEach(function (exp) {
          if (exp.start_lat == null || exp.start_lng == null) return;
          var el = document.createElement('div');
          el.className = 'minga-marker ' + (exp.is_official ? 'official' : 'user');
          el.addEventListener('click', function () {
            post({ type: 'openExpedition', id: exp.id });
          });
          new maplibregl.Marker({ element: el })
            .setLngLat([exp.start_lng, exp.start_lat])
            .addTo(map);
        });
      }

      function renderTracks(tracks, color) {
        var features = Object.keys(tracks || {}).reduce(function (acc, id) {
          var coords = tracks[id];
          if (coords && coords.length >= 2) {
            acc.push({ type: 'Feature', geometry: { type: 'LineString', coordinates: coords }, properties: { id: id } });
          }
          return acc;
        }, []);
        if (features.length === 0) return null;
        var data = { type: 'FeatureCollection', features: features };
        if (map.getSource('my-tracks')) {
          map.getSource('my-tracks').setData(data);
        } else {
          map.addSource('my-tracks', { type: 'geojson', data: data });
          map.addLayer({
            id: 'my-tracks-halo',
            type: 'line',
            source: 'my-tracks',
            paint: { 'line-color': '#ffffff', 'line-width': 7, 'line-opacity': 0.85 },
            layout: { 'line-cap': 'round', 'line-join': 'round' }
          });
          map.addLayer({
            id: 'my-tracks-line',
            type: 'line',
            source: 'my-tracks',
            paint: { 'line-color': color, 'line-width': 4, 'line-opacity': 1 },
            layout: { 'line-cap': 'round', 'line-join': 'round' }
          });
        }
        var b = new maplibregl.LngLatBounds();
        features.forEach(function (f) {
          f.geometry.coordinates.forEach(function (c) { b.extend(c); });
        });
        return b;
      }

      map.on('load', function () {
        attachGeoLayers();
        renderChips();
        renderMarkers(initial.expeditions);
        var trackBounds = renderTracks(initial.tracks, initial.primary);
        if (trackBounds && !trackBounds.isEmpty()) {
          map.fitBounds(trackBounds, { padding: 60, maxZoom: 13, duration: 800 });
        }
        var l = document.getElementById('loading');
        if (l) l.classList.add('hidden');
        post({ type: 'ready' });
      });

      map.on('error', function (e) {
        post({ type: 'error', message: (e && e.error && e.error.message) || 'map error' });
      });
    })();
  </script>
</body>
</html>`;
}

function escapeHtml(s: string): string {
  return (s ?? '').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string,
  );
}
