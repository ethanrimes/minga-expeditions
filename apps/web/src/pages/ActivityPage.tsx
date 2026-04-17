import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Bike, Footprints, Mountain, PersonStanding, X as XIcon } from 'lucide-react';
import { useTheme } from '@minga/theme';
import { useT } from '@minga/i18n';
import {
  deleteActivityComment,
  fetchActivityById,
  fetchActivityComments,
  fetchActivityRating,
  fetchActivityTrack,
  postActivityComment,
  upsertActivityRating,
} from '@minga/supabase';
import { formatDistanceKm, formatDuration, formatElevation, formatSpeedKmh, relativeTime } from '@minga/logic';
import type { ActivityType, DbActivity, DbActivityComment, DbActivityRating } from '@minga/types';
import { supabase } from '../supabase';
import { buildOsmStyle, COLOMBIA_BOUNDS } from '../map/style';

const ICON: Record<ActivityType, React.ComponentType<{ size?: number; strokeWidth?: number }>> = {
  hike: Mountain,
  ride: Bike,
  run: Footprints,
  walk: PersonStanding,
};
const ACT_KEY: Record<ActivityType, any> = {
  hike: 'track.actType.hike',
  ride: 'track.actType.ride',
  run: 'track.actType.run',
  walk: 'track.actType.walk',
};

export function ActivityPage() {
  const { id } = useParams<{ id: string }>();
  const { theme } = useTheme();
  const { t, language } = useT();
  const nav = useNavigate();
  const locale = language === 'es' ? 'es-CO' : 'en-US';

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);

  const [activity, setActivity] = useState<DbActivity | null>(null);
  const [track, setTrack] = useState<[number, number][]>([]);
  const [comments, setComments] = useState<DbActivityComment[]>([]);
  const [rating, setRating] = useState<DbActivityRating | null>(null);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    if (!id) return;
    try {
      const [act, tk, cm, rt] = await Promise.all([
        fetchActivityById(supabase, id),
        fetchActivityTrack(supabase, id),
        fetchActivityComments(supabase, id).catch(() => []),
        fetchActivityRating(supabase, id).catch(() => null),
      ]);
      setActivity(act);
      setTrack(tk);
      setComments(cm);
      setRating(rt);
    } catch (e: any) {
      setError(e?.message ?? t('common.loadError'));
    }
  };

  useEffect(() => {
    void load();
  }, [id]);

  // Init map once
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;
    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: buildOsmStyle(),
      bounds: COLOMBIA_BOUNDS,
      fitBoundsOptions: { padding: 30 },
      attributionControl: { compact: true },
    });
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Draw + auto-fit track whenever it changes
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
          paint: { 'line-color': '#fff', 'line-width': 8, 'line-opacity': 0.9 },
          layout: { 'line-cap': 'round', 'line-join': 'round' },
        });
        map.addLayer({
          id: `${src}-line`,
          type: 'line',
          source: src,
          paint: { 'line-color': theme.primary, 'line-width': 5, 'line-opacity': 1 },
          layout: { 'line-cap': 'round', 'line-join': 'round' },
        });
      }
      const b = new maplibregl.LngLatBounds();
      for (const c of track) b.extend(c as [number, number]);
      if (!b.isEmpty()) map.fitBounds(b, { padding: 60, maxZoom: 15, duration: 600 });
    };
    if (map.isStyleLoaded()) draw();
    else map.once('load', draw);
  }, [track, theme.primary]);

  if (!activity) {
    return (
      <div style={{ maxWidth: 900, margin: '40px auto', padding: '0 24px' }}>
        <p>{error ?? t('feed.loading')}</p>
      </div>
    );
  }

  const pace =
    activity.distance_km > 0 && activity.duration_seconds > 0
      ? formatSpeedKmh(activity.distance_km, activity.duration_seconds)
      : '—';

  const post = async () => {
    if (!draft.trim() || !id) return;
    try {
      await postActivityComment(supabase, { activity_id: id, body: draft.trim() });
      setDraft('');
      await load();
    } catch (e: any) {
      setError(e?.message ?? t('common.loadError'));
    }
  };
  const remove = async (cid: string) => {
    try {
      await deleteActivityComment(supabase, cid);
      await load();
    } catch (e: any) {
      setError(e?.message ?? t('common.loadError'));
    }
  };
  const rate = async (stars: 1 | 2 | 3 | 4 | 5) => {
    if (!id) return;
    try {
      await upsertActivityRating(supabase, { activity_id: id, stars });
      await load();
    } catch (e: any) {
      setError(e?.message ?? t('common.loadError'));
    }
  };

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px' }}>
      <Link to="/profile" style={{ color: theme.primary, fontWeight: 700 }}>
        {t('common.back')}
      </Link>

      <header style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '12px 0 24px' }}>
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 14,
            background: theme.primaryMuted,
            color: theme.primary,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {React.createElement(ICON[activity.activity_type], { size: 28, strokeWidth: 2.2 })}
        </div>
        <div>
          <h1 style={{ margin: 0, color: theme.text, fontSize: 36, fontWeight: 800 }}>{activity.title}</h1>
          <div style={{ color: theme.textMuted }}>
            {t(ACT_KEY[activity.activity_type])} · {new Date(activity.started_at).toLocaleDateString(locale)}
          </div>
        </div>
      </header>

      <div
        ref={mapContainerRef}
        style={{
          width: '100%',
          height: 420,
          borderRadius: 16,
          overflow: 'hidden',
          border: `1px solid ${theme.border}`,
          background: theme.surfaceAlt,
          marginBottom: 24,
        }}
      />

      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: 12,
          background: theme.surfaceAlt,
          padding: 20,
          borderRadius: 16,
          marginBottom: 24,
        }}
      >
        <Stat theme={theme} label={t('stats.distance')} value={formatDistanceKm(activity.distance_km)} />
        <Stat theme={theme} label={t('stats.duration')} value={formatDuration(activity.duration_seconds)} />
        <Stat theme={theme} label={t('stats.elevation')} value={formatElevation(activity.elevation_gain_m)} />
        <Stat theme={theme} label={t('feed.pace')} value={pace} />
      </section>

      {activity.notes ? (
        <p style={{ color: theme.text, fontSize: 16, lineHeight: 1.6, whiteSpace: 'pre-wrap', marginBottom: 16 }}>
          {activity.notes}
        </p>
      ) : null}

      {activity.expedition_id ? (
        <button
          onClick={() => nav(`/expeditions/${activity.expedition_id}`)}
          style={{
            background: theme.surfaceAlt,
            color: theme.text,
            border: `1px solid ${theme.border}`,
            padding: '10px 18px',
            borderRadius: 999,
            fontWeight: 700,
            marginBottom: 24,
          }}
        >
          {t('activity.openExpedition')}
        </button>
      ) : (
        <p style={{ color: theme.textMuted, fontStyle: 'italic', marginBottom: 24 }}>
          {t('activity.noLinkedExpedition')}
        </p>
      )}

      <section style={{ marginBottom: 24 }}>
        <h2 style={{ color: theme.text, marginBottom: 8 }}>{t('activity.rateHeading')}</h2>
        <StarPicker value={rating?.stars ?? 0} onPick={rate} color={theme.accent} muted={theme.textMuted} />
      </section>

      <section>
        <h2 style={{ color: theme.text, marginBottom: 8 }}>
          {t('activity.commentsHeading')} ({comments.length})
        </h2>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={t('activity.commentPlaceholder')}
            style={{
              flex: 1,
              padding: 12,
              borderRadius: 12,
              border: `1px solid ${theme.border}`,
              background: theme.surface,
              color: theme.text,
              minHeight: 72,
              resize: 'vertical',
            }}
          />
          <button
            onClick={post}
            style={{
              background: theme.primary,
              color: theme.onPrimary,
              border: 0,
              borderRadius: 12,
              padding: '0 20px',
              fontWeight: 700,
              alignSelf: 'stretch',
            }}
          >
            {t('detail.post')}
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {comments.map((c) => (
            <div
              key={c.id}
              style={{
                background: theme.surface,
                border: `1px solid ${theme.border}`,
                borderRadius: 14,
                padding: 16,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ color: theme.textMuted, fontSize: 12 }}>{relativeTime(c.created_at, language)}</span>
                <button
                  onClick={() => remove(c.id)}
                  aria-label="delete"
                  style={{
                    background: 'transparent',
                    border: 0,
                    color: theme.danger,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    padding: 2,
                  }}
                >
                  <XIcon size={14} strokeWidth={2.5} />
                </button>
              </div>
              <div style={{ color: theme.text, lineHeight: 1.5 }}>{c.body}</div>
            </div>
          ))}
        </div>
      </section>

      {error ? <p style={{ color: theme.danger, marginTop: 16 }}>{error}</p> : null}
    </div>
  );
}

function StarPicker({
  value,
  onPick,
  color,
  muted,
}: {
  value: number;
  onPick: (stars: 1 | 2 | 3 | 4 | 5) => void;
  color: string;
  muted: string;
}) {
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          onClick={() => onPick(n as 1 | 2 | 3 | 4 | 5)}
          style={{
            background: 'transparent',
            border: 0,
            color: value >= n ? color : muted,
            fontSize: 28,
            padding: 0,
            cursor: 'pointer',
          }}
        >
          ★
        </button>
      ))}
    </div>
  );
}

function Stat({ theme, label, value }: { theme: any; label: string; value: string }) {
  return (
    <div>
      <div style={{ color: theme.text, fontWeight: 800, fontSize: 18 }}>{value}</div>
      <div style={{ color: theme.textMuted, fontSize: 11, letterSpacing: 0.5, textTransform: 'uppercase' }}>
        {label}
      </div>
    </div>
  );
}
