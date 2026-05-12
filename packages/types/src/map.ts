// Shared overlay-layer config for the map screens in web, mobile-web, and
// mobile (WebView). Each entry maps to:
//   - one MVT source-layer name (string match with public.geo_tile in SQL)
//   - one or more MapLibre layer styles (fill + line for polygons)
//
// The IDs here must mirror ALLOWED_LAYERS in supabase/functions/geo-tile.
// minzoom values match the server-side gates inside the SQL geo_tile fn —
// duplicated client-side so MapLibre stops requesting empty tiles below them.

export type GeoLayerStyle = {
  type: 'fill' | 'line';
  paint: Record<string, unknown>;
  layout?: Record<string, unknown>;
};

export type GeoLayerDef = {
  /** Slug used in the MVT URL and as ST_AsMVT layer/source-layer name. */
  id: GeoLayerId;
  /** Spanish UI label for toggle chips/legend. */
  label: string;
  /** Min zoom at which MapLibre should request tiles. Mirrors the SQL gate. */
  minzoom: number;
  /** Max zoom for the source — tiles beyond this overzoom. */
  maxzoom: number;
  /** Whether the layer is on by default in the toggle UI. */
  defaultVisible: boolean;
  /** One or more paint layers (fill + outline for polygons). */
  styles: GeoLayerStyle[];
};

export type GeoLayerId =
  | 'departamentos'
  | 'municipios'
  | 'veredas'
  | 'biomas'
  | 'areas_protegidas'
  | 'paramos'
  | 'glaciares';

export const GEO_LAYERS: GeoLayerDef[] = [
  {
    id: 'departamentos',
    label: 'Departamentos',
    minzoom: 0,
    maxzoom: 14,
    defaultVisible: false,
    styles: [
      {
        type: 'line',
        paint: { 'line-color': '#4a5568', 'line-width': 1.2, 'line-opacity': 0.8 },
        layout: { 'line-cap': 'round', 'line-join': 'round' },
      },
    ],
  },
  {
    id: 'municipios',
    label: 'Municipios',
    minzoom: 6,
    maxzoom: 14,
    defaultVisible: false,
    styles: [
      {
        type: 'line',
        paint: { 'line-color': '#718096', 'line-width': 0.8, 'line-opacity': 0.7 },
        layout: { 'line-cap': 'round', 'line-join': 'round' },
      },
    ],
  },
  {
    id: 'veredas',
    label: 'Veredas',
    minzoom: 11,
    maxzoom: 14,
    defaultVisible: false,
    styles: [
      {
        type: 'line',
        paint: {
          'line-color': '#a0aec0',
          'line-width': 0.5,
          'line-opacity': 0.6,
          'line-dasharray': [2, 2],
        },
      },
    ],
  },
  {
    id: 'biomas',
    label: 'Biomas',
    minzoom: 5,
    maxzoom: 14,
    defaultVisible: false,
    styles: [
      { type: 'fill', paint: { 'fill-color': '#48bb78', 'fill-opacity': 0.15 } },
      { type: 'line', paint: { 'line-color': '#2f855a', 'line-width': 0.5, 'line-opacity': 0.5 } },
    ],
  },
  {
    id: 'areas_protegidas',
    label: 'Áreas protegidas',
    minzoom: 0,
    maxzoom: 14,
    defaultVisible: true,
    styles: [
      { type: 'fill', paint: { 'fill-color': '#38a169', 'fill-opacity': 0.20 } },
      { type: 'line', paint: { 'line-color': '#22543d', 'line-width': 1.0, 'line-opacity': 0.7 } },
    ],
  },
  {
    id: 'paramos',
    label: 'Páramos',
    minzoom: 0,
    maxzoom: 14,
    defaultVisible: true,
    styles: [
      { type: 'fill', paint: { 'fill-color': '#805ad5', 'fill-opacity': 0.25 } },
      { type: 'line', paint: { 'line-color': '#553c9a', 'line-width': 1.0, 'line-opacity': 0.7 } },
    ],
  },
  {
    id: 'glaciares',
    label: 'Glaciares',
    minzoom: 0,
    maxzoom: 14,
    defaultVisible: true,
    styles: [
      { type: 'fill', paint: { 'fill-color': '#bee3f8', 'fill-opacity': 0.70 } },
      { type: 'line', paint: { 'line-color': '#2c5282', 'line-width': 1.0 } },
    ],
  },
];

/** Build the MVT tile URL template for a layer. supabaseUrl is the project URL
 *  (no trailing slash), e.g. https://abc123.supabase.co */
export function buildGeoTileUrl(supabaseUrl: string, layer: GeoLayerId): string {
  return `${supabaseUrl.replace(/\/+$/, '')}/functions/v1/geo-tile/${layer}/{z}/{x}/{y}.mvt`;
}
