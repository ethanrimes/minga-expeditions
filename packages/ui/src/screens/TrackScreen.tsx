import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { useTheme, spacing, fontSizes, fontWeights, radii } from '@minga/theme';
import { formatDistanceKm, formatDuration, formatElevation, formatSpeedKmh } from '@minga/logic';
import { useT } from '@minga/i18n';
import type { ActivityType } from '@minga/types';
import { getSupabase, saveActivity } from '@minga/supabase';
import { Screen } from '../primitives/Screen';
import { Button } from '../primitives/Button';
import { StatBlock } from '../primitives/StatBlock';
import { Input } from '../primitives/Input';
import { CategoryChip } from '../primitives/CategoryChip';
import { useTracker, type StartLocationStream } from '../hooks/useTracker';

const ACTIVITY_TYPES: ActivityType[] = ['hike', 'ride', 'run', 'walk'];
const ACT_KEY: Record<ActivityType, any> = {
  hike: 'track.actType.hike',
  ride: 'track.actType.ride',
  run: 'track.actType.run',
  walk: 'track.actType.walk',
};

// Apps inject `startLocationStream` — see apps/mobile-web/src/locationAdapter.ts and apps/mobile/src/locationAdapter.ts.
export function TrackScreen({
  startLocationStream,
}: {
  startLocationStream: StartLocationStream;
}) {
  const { theme } = useTheme();
  const { t, language } = useT();
  const { status, summary, elapsed, error, start, pause, resume, stop, reset, points } = useTracker(startLocationStream);
  const [activityType, setActivityType] = useState<ActivityType>('hike');
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  const handleSave = async () => {
    setSaving(true);
    setSavedMsg(null);
    try {
      const locale = language === 'es' ? 'es-CO' : 'en-US';
      const fallbackTitle = `${t(ACT_KEY[activityType])} · ${new Date().toLocaleDateString(locale)}`;
      await saveActivity(getSupabase(), {
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
      setTitle('');
      setNotes('');
    } catch (e: any) {
      setSavedMsg(e?.message ?? t('common.loadError'));
    } finally {
      setSaving(false);
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
    <Screen>
      <View style={{ paddingTop: spacing.xl }}>
        <Text style={{ color: theme.text, fontSize: fontSizes['2xl'], fontWeight: fontWeights.heavy }}>
          {t('track.title')}
        </Text>
        <Text style={{ color: theme.textMuted }}>{t('track.subtitle')}</Text>
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
        {ACTIVITY_TYPES.map((typ) => (
          <CategoryChip
            key={typ}
            label={t(ACT_KEY[typ])}
            active={activityType === typ}
            onPress={() => setActivityType(typ)}
          />
        ))}
      </View>

      <View
        style={{
          backgroundColor: theme.surfaceAlt,
          borderRadius: radii.xl,
          padding: spacing.xl,
          gap: spacing.md,
          alignItems: 'center',
        }}
      >
        <Text style={{ color: theme.textMuted, fontSize: fontSizes.xs, letterSpacing: 1, textTransform: 'uppercase' }}>
          {statusLabel}
        </Text>
        <Text style={{ color: theme.text, fontSize: 60, fontWeight: fontWeights.heavy, letterSpacing: 2 }}>
          {formatDuration(elapsed)}
        </Text>
        <View style={{ flexDirection: 'row', gap: spacing.xl }}>
          <StatBlock label="km" value={summary.distanceKm.toFixed(2)} />
          <StatBlock label={language === 'es' ? 'desnivel m' : 'elev m'} value={String(Math.round(summary.elevationGainM))} />
          <StatBlock label={language === 'es' ? 'km/h prom' : 'avg km/h'} value={summary.avgSpeedKmh.toFixed(1)} />
        </View>
      </View>

      {error ? <Text style={{ color: theme.danger }}>{error}</Text> : null}

      <View style={{ flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' }}>
        {status === 'idle' || status === 'ended' ? (
          <Button label={t('track.start')} onPress={start} size="lg" fullWidth />
        ) : null}
        {status === 'recording' ? (
          <Button label={t('track.pause')} variant="secondary" onPress={pause} />
        ) : null}
        {status === 'paused' ? <Button label={t('track.resume')} onPress={resume} /> : null}
        {status === 'recording' || status === 'paused' ? (
          <Button label={t('track.finish')} variant="danger" onPress={stop} />
        ) : null}
      </View>

      {status === 'ended' ? (
        <View style={{ gap: spacing.md }}>
          <Input label={t('stats.duration')} placeholder={t('track.titlePlaceholder')} value={title} onChangeText={setTitle} />
          <Input
            label={t('track.notesPlaceholder')}
            placeholder={t('track.notesPlaceholder')}
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
          />
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <Button label={t('track.save')} loading={saving} onPress={handleSave} />
            <Button label={t('track.discard')} variant="ghost" onPress={reset} />
          </View>
          <Text style={{ color: theme.textMuted, fontSize: fontSizes.sm }}>
            {summary.distanceKm > 0
              ? `${t('feed.pace')}: ${formatSpeedKmh(summary.distanceKm, elapsed)} · ${t('stats.duration')} ${formatDuration(elapsed)} · ${t('stats.elevation')} ${formatElevation(summary.elevationGainM)}`
              : ''}
          </Text>
        </View>
      ) : null}

      {savedMsg ? <Text style={{ color: theme.success }}>{savedMsg}</Text> : null}
    </Screen>
  );
}
