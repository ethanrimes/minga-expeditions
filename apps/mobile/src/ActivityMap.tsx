import React, { useMemo } from 'react';
import { View } from 'react-native';
import { WebView } from 'react-native-webview';
import type { ActivityMapProps } from '@minga/ui';

// Renders a single activity's track as a MapLibre polyline inside a WebView.
// The HTML is self-contained — MapLibre GL JS loaded from unpkg, track data
// baked in at render time, auto-fit to the polyline.
export function ActivityMap({ track, primary, surfaceAlt, border, loadingLabel }: ActivityMapProps) {
  const html = useMemo(() => buildHtml(track, primary, surfaceAlt, loadingLabel), [track, primary, surfaceAlt, loadingLabel]);
  return (
    <View style={{ flex: 1, borderColor: border, borderWidth: 0, backgroundColor: surfaceAlt }}>
      <WebView
        originWhitelist={['*']}
        source={{ html, baseUrl: 'https://minga.local/' }}
        javaScriptEnabled
        domStorageEnabled
        startInLoadingState
        mixedContentMode="compatibility"
        setSupportMultipleWindows={false}
        style={{ flex: 1, backgroundColor: surfaceAlt }}
      />
    </View>
  );
}

function buildHtml(track: [number, number][], primary: string, bg: string, loadingLabel: string): string {
  const data = JSON.stringify(track).replace(/</g, '\\u003C');
  return `<!doctype html>
<html><head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
<link rel="stylesheet" href="https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.css" />
<style>
  html, body, #map { margin:0; padding:0; height:100%; width:100%; background:${bg}; }
  .loading { position:absolute; inset:0; display:flex; align-items:center; justify-content:center; color:#888; font-family:-apple-system,sans-serif; font-weight:700; transition:opacity .2s; z-index:3; }
  .loading.hidden { opacity:0; pointer-events:none; }
</style>
</head>
<body>
<div id="map"></div>
<div id="loading" class="loading">${escapeHtml(loadingLabel)}</div>
<script src="https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.js"></script>
<script>
  (function () {
    var track = ${data};
    var map = new maplibregl.Map({
      container: 'map',
      style: {
        version: 8,
        sources: { osm: {
          type: 'raster',
          tiles: ['https://a.tile.openstreetmap.org/{z}/{x}/{y}.png','https://b.tile.openstreetmap.org/{z}/{x}/{y}.png','https://c.tile.openstreetmap.org/{z}/{x}/{y}.png'],
          tileSize: 256,
          attribution: '© OpenStreetMap contributors'
        }},
        layers: [{ id: 'osm', type: 'raster', source: 'osm' }]
      },
      bounds: [[-79,-4.5],[-66.8,13.5]],
      fitBoundsOptions: { padding: 20 }
    });
    map.on('load', function () {
      if (track.length >= 2) {
        map.addSource('t', { type: 'geojson', data: { type:'Feature', geometry:{ type:'LineString', coordinates: track }, properties:{} }});
        map.addLayer({ id: 't-halo', type: 'line', source: 't', paint:{ 'line-color':'#fff','line-width':7,'line-opacity':0.9 }, layout:{ 'line-cap':'round','line-join':'round' }});
        map.addLayer({ id: 't-line', type: 'line', source: 't', paint:{ 'line-color':'${primary}','line-width':4,'line-opacity':1 }, layout:{ 'line-cap':'round','line-join':'round' }});
        var b = new maplibregl.LngLatBounds();
        track.forEach(function (c) { b.extend(c); });
        if (!b.isEmpty()) map.fitBounds(b, { padding: 30, maxZoom: 15, duration: 600 });
      }
      var l = document.getElementById('loading'); if (l) l.classList.add('hidden');
    });
  })();
</script>
</body></html>`;
}

function escapeHtml(s: string): string {
  return (s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));
}
