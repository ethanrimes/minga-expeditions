import type { StyleSpecification, LngLatBoundsLike } from 'maplibre-gl';

// OSM raster tiles via MapLibre's demo tile endpoint. No API key required.
// For production, consider a dedicated tile host (MapTiler, Stadia, self-hosted)
// so OSM's community infra isn't burdened.
export function buildOsmStyle(): StyleSpecification {
  return {
    version: 8,
    sources: {
      osm: {
        type: 'raster',
        tiles: [
          'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
          'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
          'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png',
        ],
        tileSize: 256,
        attribution:
          '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors',
      },
    },
    layers: [
      {
        id: 'osm',
        type: 'raster',
        source: 'osm',
        minzoom: 0,
        maxzoom: 19,
      },
    ],
  };
}

// Bounding box for Colombia (west, south, east, north). Used for initial fit.
export const COLOMBIA_BOUNDS: LngLatBoundsLike = [
  [-79.0, -4.5],
  [-66.8, 13.5],
];

// DANE Geoportal WFS/WMS references — plumbed for future boundary overlays.
// See https://geoportal.dane.gov.co/servicios/servicios-web-geograficos/
export const DANE_WMS_BASE = 'https://geoportal.dane.gov.co/laboratorio/serviciosmapas/services';
