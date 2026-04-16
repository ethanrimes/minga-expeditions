import React, { useEffect, useRef, useState } from 'react';
import { useTheme } from '@minga/theme';
import { useT } from '@minga/i18n';
import {
  formatDistanceKm,
  formatDuration,
  formatElevation,
  formatSpeedKmh,
  summarizeTrack,
} from '@minga/logic';
import { saveActivity } from '@minga/supabase';
import type { ActivityType, TrackPoint } from '@minga/types';
import { supabase } from '../supabase';

const ACTIVITY_TYPES: ActivityType[] = ['hike', 'ride', 'run', 'walk'];
const ACT_KEY: Record<ActivityType, any> = {
  hike: 'track.actType.hike',
  ride: 'track.actType.ride',
  run: 'track.actType.run',
  walk: 'track.actType.walk',
};

type Status = 'idle' | 'recording' | 'paused' | 'ended';

export function TrackPage() {
  const { theme } = useTheme();
  const { t, language } = useT();
  const locale = language === 'es' ? 'es-CO' : 'en-US';
  const [status, setStatus] = useState<Status>('idle');
  const [points, setPoints] = useState<TrackPoint[]>([]);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [activityType, setActivityType] = useState<ActivityType>('hike');
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  const watchIdRef = useRef<number | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startedAtRef = useRef(0);
  const accumulatedRef = useRef(0);

  const clearTick = () => {
    if (tickRef.current) clearInterval(tickRef.current);
    tickRef.current = null;
  };

  const startTick = () => {
    startedAtRef.current = Date.now();
    tickRef.current = setInterval(() => {
      setElapsed(Math.round(accumulatedRef.current + (Date.now() - startedAtRef.current) / 1000));
    }, 1000);
  };

  const stopWatch = () => {
    if (watchIdRef.current !== null && 'geolocation' in navigator) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  };

  const start = () => {
    setError(null);
    if (!('geolocation' in navigator)) {
      setError(
        language === 'es'
          ? 'La geolocalización no está disponible en este navegador.'
          : 'Geolocation is not available in this browser.',
      );
      return;
    }
    accumulatedRef.current = 0;
    setPoints([]);
    setElapsed(0);
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const p: TrackPoint = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          altitude_m: pos.coords.altitude,
          speed_ms: pos.coords.speed,
          timestamp: pos.timestamp,
        };
        setPoints((prev) => [...prev, p]);
      },
      (err) => setError(err.message),
      { enableHighAccuracy: true, maximumAge: 1000, timeout: 10000 },
    );
    setStatus('recording');
    startTick();
  };

  const pause = () => {
    accumulatedRef.current += (Date.now() - startedAtRef.current) / 1000;
    clearTick();
    setStatus('paused');
  };

  const resume = () => {
    startTick();
    setStatus('recording');
  };

  const stop = () => {
    if (status === 'recording') accumulatedRef.current += (Date.now() - startedAtRef.current) / 1000;
    clearTick();
    stopWatch();
    setElapsed(Math.round(accumulatedRef.current));
    setStatus('ended');
  };

  const reset = () => {
    stopWatch();
    clearTick();
    accumulatedRef.current = 0;
    setElapsed(0);
    setPoints([]);
    setStatus('idle');
    setError(null);
    setTitle('');
    setNotes('');
    setSavedMsg(null);
  };

  useEffect(() => () => {
    stopWatch();
    clearTick();
  }, []);

  const summary = summarizeTrack(points);
  summary.durationSeconds = elapsed;
  summary.avgSpeedKmh = elapsed > 0 ? summary.distanceKm / (elapsed / 3600) : 0;

  const save = async () => {
    setSavedMsg(null);
    try {
      const fallbackTitle = `${t(ACT_KEY[activityType])} · ${new Date().toLocaleDateString(locale)}`;
      await saveActivity(supabase, {
        activity_type: activityType,
        title: title.trim() || fallbackTitle,
        started_at: new Date(points[0]?.timestamp ?? Date.now() - elapsed * 1000).toISOString(),
        ended_at: new Date().toISOString(),
        distance_km: summary.distanceKm,
        elevation_gain_m: summary.elevationGainM,
        duration_seconds: summary.durationSeconds,
        notes: notes.trim() || null,
        track: points,
      });
      setSavedMsg(t('track.savedSuccess'));
      reset();
    } catch (e: any) {
      setSavedMsg(e?.message ?? t('common.loadError'));
    }
  };

  const statusLabel =
    status === 'recording'
      ? t('track.statusRecording')
      : status === 'paused'
        ? t('track.statusPaused')
        : status === 'ended'
          ? t('track.statusEnded')
          : t('track.statusReady');

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '40px 24px' }}>
      <h1 style={{ color: theme.text }}>{t('track.title')}</h1>
      <p style={{ color: theme.textMuted }}>{t('track.subtitle')}</p>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
        {ACTIVITY_TYPES.map((typ) => {
          const active = typ === activityType;
          return (
            <button
              key={typ}
              onClick={() => setActivityType(typ)}
              style={{
                background: active ? theme.primary : theme.surfaceAlt,
                color: active ? theme.onPrimary : theme.text,
                border: `1px solid ${active ? theme.primary : theme.border}`,
                padding: '8px 16px',
                borderRadius: 999,
                fontWeight: 700,
              }}
            >
              {t(ACT_KEY[typ])}
            </button>
          );
        })}
      </div>

      <section
        style={{
          background: theme.surfaceAlt,
          padding: 32,
          borderRadius: 20,
          textAlign: 'center',
          marginBottom: 20,
        }}
      >
        <div style={{ color: theme.textMuted, fontSize: 13, letterSpacing: 2, textTransform: 'uppercase' }}>
          {statusLabel}
        </div>
        <div style={{ color: theme.text, fontSize: 64, fontWeight: 800, letterSpacing: 2, margin: '4px 0 16px' }}>
          {formatDuration(elapsed)}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-around', gap: 16 }}>
          <Metric theme={theme} label="km" value={summary.distanceKm.toFixed(2)} />
          <Metric
            theme={theme}
            label={language === 'es' ? 'desnivel m' : 'elev m'}
            value={String(Math.round(summary.elevationGainM))}
          />
          <Metric
            theme={theme}
            label={language === 'es' ? 'km/h prom' : 'avg km/h'}
            value={summary.avgSpeedKmh.toFixed(1)}
          />
        </div>
      </section>

      {error ? <div style={{ color: theme.danger, marginBottom: 16 }}>{error}</div> : null}

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
        {(status === 'idle' || status === 'ended') && (
          <Btn theme={theme} label={t('track.start')} primary onClick={start} />
        )}
        {status === 'recording' && <Btn theme={theme} label={t('track.pause')} onClick={pause} />}
        {status === 'paused' && <Btn theme={theme} label={t('track.resume')} primary onClick={resume} />}
        {(status === 'recording' || status === 'paused') && (
          <Btn theme={theme} label={t('track.finish')} danger onClick={stop} />
        )}
      </div>

      {status === 'ended' ? (
        <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t('track.titlePlaceholder')}
            style={inputStyle(theme)}
          />
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={t('track.notesPlaceholder')}
            rows={3}
            style={inputStyle(theme)}
          />
          <div style={{ display: 'flex', gap: 12 }}>
            <Btn theme={theme} label={t('track.save')} primary onClick={save} />
            <Btn theme={theme} label={t('track.discard')} onClick={reset} />
          </div>
          <div style={{ color: theme.textMuted, fontSize: 13 }}>
            {summary.distanceKm > 0
              ? `${t('feed.pace')} ${formatSpeedKmh(summary.distanceKm, elapsed)} · ${formatDistanceKm(summary.distanceKm)} · ${formatElevation(summary.elevationGainM)}`
              : ''}
          </div>
        </section>
      ) : null}

      {savedMsg ? <div style={{ color: theme.success, marginTop: 24, fontWeight: 700 }}>{savedMsg}</div> : null}
    </div>
  );
}

function Metric({ theme, label, value }: { theme: any; label: string; value: string }) {
  return (
    <div>
      <div style={{ color: theme.text, fontSize: 24, fontWeight: 800 }}>{value}</div>
      <div style={{ color: theme.textMuted, fontSize: 11, letterSpacing: 0.5, textTransform: 'uppercase' }}>
        {label}
      </div>
    </div>
  );
}

function Btn({
  theme,
  label,
  onClick,
  primary,
  danger,
}: {
  theme: any;
  label: string;
  onClick: () => void;
  primary?: boolean;
  danger?: boolean;
}) {
  const bg = primary ? theme.primary : danger ? theme.danger : theme.surfaceAlt;
  const fg = primary || danger ? theme.onPrimary : theme.text;
  return (
    <button
      onClick={onClick}
      style={{
        background: bg,
        color: fg,
        border: primary || danger ? 0 : `1px solid ${theme.border}`,
        padding: '12px 24px',
        borderRadius: 999,
        fontWeight: 800,
        fontSize: 15,
      }}
    >
      {label}
    </button>
  );
}

function inputStyle(theme: any): React.CSSProperties {
  return {
    padding: '12px 14px',
    borderRadius: 12,
    border: `1px solid ${theme.border}`,
    background: theme.surface,
    color: theme.text,
    fontSize: 15,
    resize: 'vertical',
  };
}
