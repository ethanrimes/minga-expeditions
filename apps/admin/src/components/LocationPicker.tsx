'use client';

import 'maplibre-gl/dist/maplibre-gl.css';
import { useEffect, useRef, useState } from 'react';
import type { Map as MlMap, Marker as MlMarker } from 'maplibre-gl';

export type PickerLocale = 'en' | 'es';

interface Labels {
  search: string;
  searchPlaceholder: string;
  searching: string;
  noResults: string;
  latitude: string;
  longitude: string;
  help: string;
}

interface Props {
  initialLat: number | null;
  initialLng: number | null;
  locale: PickerLocale;
  labels: Labels;
}

interface PhotonFeature {
  geometry: { coordinates: [number, number] };
  properties: {
    name?: string;
    osm_value?: string;
    osm_key?: string;
    city?: string;
    county?: string;
    state?: string;
    country?: string;
    countrycode?: string;
    type?: string;
  };
}

// Loose box around Colombia (Pacific to Caribbean, mainland only). Photon
// biases scoring toward results inside this bbox but still surfaces global
// matches if nothing local fits.
const COLOMBIA_BBOX = '-79.5,-4.5,-66,13.5';
const COLOMBIA_CENTER: [number, number] = [-74.08, 4.71];
const STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty';
const PIN_COLOR = '#cb5e28';

export function LocationPicker({ initialLat, initialLng, locale, labels }: Props) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MlMap | null>(null);
  const markerRef = useRef<MlMarker | null>(null);
  // Set right before pick()/clear write a new query value so the search
  // effect skips its next run — otherwise the freshly-picked name would
  // immediately re-trigger a Photon query and pop the dropdown back open.
  const skipNextSearchRef = useRef(false);

  const [lat, setLat] = useState<number | null>(initialLat);
  const [lng, setLng] = useState<number | null>(initialLng);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PhotonFeature[]>([]);
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Bootstrap MapLibre once on mount. The import is dynamic so the (heavy)
  // bundle never executes on the server during SSR — and Next.js can render
  // the surrounding form without touching the WebGL globals.
  useEffect(() => {
    if (!mapContainerRef.current) return;
    let cancelled = false;

    (async () => {
      const { Map, Marker, NavigationControl } = await import('maplibre-gl');
      if (cancelled || !mapContainerRef.current) return;

      const hasInitial = initialLat != null && initialLng != null;
      const startCenter: [number, number] = hasInitial
        ? [initialLng as number, initialLat as number]
        : COLOMBIA_CENTER;

      const map = new Map({
        container: mapContainerRef.current,
        style: STYLE_URL,
        center: startCenter,
        zoom: hasInitial ? 11 : 5,
      });
      map.addControl(new NavigationControl({}), 'top-right');

      const marker = new Marker({ draggable: true, color: PIN_COLOR })
        .setLngLat(startCenter)
        .addTo(map);

      marker.on('dragend', () => {
        const ll = marker.getLngLat();
        setLat(ll.lat);
        setLng(ll.lng);
      });

      map.on('click', (e) => {
        marker.setLngLat(e.lngLat);
        setLat(e.lngLat.lat);
        setLng(e.lngLat.lng);
      });

      mapRef.current = map;
      markerRef.current = marker;
    })();

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // initialLat/initialLng are only consulted on first mount; later edits
    // come from this component's own state, so re-running this effect on
    // every parent re-render would tear down the map for no reason.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Photon search with a 300ms debounce. Photon's usage policy asks clients
  // to keep request rates reasonable; debouncing keeps us well under any
  // realistic threshold for an admin tool.
  useEffect(() => {
    if (skipNextSearchRef.current) {
      skipNextSearchRef.current = false;
      return;
    }
    if (!query.trim()) {
      setResults([]);
      setHasSearched(false);
      return;
    }
    const handle = setTimeout(async () => {
      setSearching(true);
      try {
        // Photon's public instance only translates names into de/en/fr/it; an
        // unsupported lang returns 400. For Spanish admins we omit the param,
        // which yields the OSM default name (already Spanish for Colombia).
        const params = new URLSearchParams({
          q: query,
          limit: '8',
          bbox: COLOMBIA_BBOX,
        });
        if (locale === 'en') params.set('lang', 'en');
        const res = await fetch(`https://photon.komoot.io/api?${params.toString()}`);
        const data = (await res.json()) as { features?: PhotonFeature[] };
        setResults(data.features ?? []);
        setHasSearched(true);
      } catch {
        setResults([]);
        setHasSearched(true);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(handle);
  }, [query, locale]);

  function pick(feature: PhotonFeature) {
    const [pLng, pLat] = feature.geometry.coordinates;
    setLat(pLat);
    setLng(pLng);
    skipNextSearchRef.current = true;
    setQuery(feature.properties.name ?? '');
    setResults([]);
    setHasSearched(false);
    mapRef.current?.flyTo({ center: [pLng, pLat], zoom: 13 });
    markerRef.current?.setLngLat([pLng, pLat]);
  }

  function onLatInput(v: string) {
    const n = v === '' ? null : Number(v);
    setLat(n);
    if (n != null && lng != null) markerRef.current?.setLngLat([lng, n]);
  }

  function onLngInput(v: string) {
    const n = v === '' ? null : Number(v);
    setLng(n);
    if (lat != null && n != null) markerRef.current?.setLngLat([n, lat]);
  }

  return (
    <fieldset className="field">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={labels.searchPlaceholder}
          aria-label={labels.search}
          className="field-input"
        />
        {results.length > 0 ? (
          <ul className="absolute z-10 left-0 right-0 mt-1 border border-surface-border rounded-md bg-surface divide-y divide-surface-border max-h-64 overflow-y-auto shadow-lg">
            {results.map((f, i) => (
              <li key={i}>
                <button
                  type="button"
                  onClick={() => pick(f)}
                  className="w-full text-left px-3 py-2 hover:bg-surface-alt text-sm"
                >
                  <div className="font-medium">{f.properties.name ?? '—'}</div>
                  <div className="text-xs text-ink-500">{formatResultDetail(f.properties)}</div>
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      {searching ? <p className="text-xs text-ink-500 mt-1">{labels.searching}</p> : null}
      {hasSearched && !searching && results.length === 0 ? (
        <p className="text-xs text-ink-500 mt-1">{labels.noResults}</p>
      ) : null}

      <div
        ref={mapContainerRef}
        className="mt-3 h-80 w-full rounded-md border border-surface-border overflow-hidden"
      />

      <p className="text-xs text-ink-500 mt-2">{labels.help}</p>

      <div className="grid grid-cols-2 gap-3 mt-3">
        <label className="field">
          <span className="field-label">{labels.latitude}</span>
          <input
            name="start_lat"
            type="number"
            step="0.000001"
            value={lat ?? ''}
            onChange={(e) => onLatInput(e.target.value)}
            className="field-input"
          />
        </label>
        <label className="field">
          <span className="field-label">{labels.longitude}</span>
          <input
            name="start_lng"
            type="number"
            step="0.000001"
            value={lng ?? ''}
            onChange={(e) => onLngInput(e.target.value)}
            className="field-input"
          />
        </label>
      </div>
    </fieldset>
  );
}

function formatResultDetail(p: PhotonFeature['properties']): string {
  const parts = [p.city, p.county, p.state, p.country].filter((s): s is string => !!s);
  const tail = parts.join(', ');
  const type = p.osm_value ?? p.type ?? '';
  return type ? (tail ? `${type} · ${tail}` : type) : tail;
}
