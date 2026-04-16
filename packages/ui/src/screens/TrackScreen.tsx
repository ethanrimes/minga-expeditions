import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { useTheme, spacing, fontSizes, fontWeights, radii } from '@minga/theme';
import { formatDistanceKm, formatDuration, formatElevation, formatSpeedKmh } from '@minga/logic';
import type { ActivityType } from '@minga/types';
import { getSupabase, saveActivity } from '@minga/supabase';
import { Screen } from '../primitives/Screen';
import { Button } from '../primitives/Button';
import { StatBlock } from '../primitives/StatBlock';
import { Input } from '../primitives/Input';
import { CategoryChip } from '../primitives/CategoryChip';
import { useTracker, type StartLocationStream } from '../hooks/useTracker';

const ACTIVITY_TYPES: ActivityType[] = ['hike', 'ride', 'run', 'walk'];

// Apps inject `startLocationStream` — see apps/mobile-web/src/locationAdapter.ts and apps/mobile/src/locationAdapter.ts.
export function TrackScreen({
  startLocationStream,
}: {
  startLocationStream: StartLocationStream;
}) {
  const { theme } = useTheme();
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
      await saveActivity(getSupabase(), {
        activity_type: activityType,
        title: title.trim() || `${activityType[0].toUpperCase()}${activityType.slice(1)} on ${new Date().toLocaleDateString()}`,
        started_at: new Date(points[0]?.timestamp ?? Date.now() - elapsed * 1000).toISOString(),
        ended_at: new Date().toISOString(),
        distance_km: summary.distanceKm,
        elevation_gain_m: summary.elevationGainM,
        duration_seconds: summary.durationSeconds,
        notes: notes.trim() || null,
        track: points,
      });
      setSavedMsg('Saved! Check your profile.');
      reset();
      setTitle('');
      setNotes('');
    } catch (e: any) {
      setSavedMsg(e?.message ?? 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen>
      <View style={{ paddingTop: spacing.xl }}>
        <Text style={{ color: theme.text, fontSize: fontSizes['2xl'], fontWeight: fontWeights.heavy }}>
          Track activity
        </Text>
        <Text style={{ color: theme.textMuted }}>
          GPS-tracked km, elevation & pace — Strava-style.
        </Text>
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
        {ACTIVITY_TYPES.map((t) => (
          <CategoryChip key={t} label={t} active={activityType === t} onPress={() => setActivityType(t)} />
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
          {status === 'recording' ? 'Recording' : status === 'paused' ? 'Paused' : status === 'ended' ? 'Finished' : 'Ready'}
        </Text>
        <Text style={{ color: theme.text, fontSize: 60, fontWeight: fontWeights.heavy, letterSpacing: 2 }}>
          {formatDuration(elapsed)}
        </Text>
        <View style={{ flexDirection: 'row', gap: spacing.xl }}>
          <StatBlock label="km" value={summary.distanceKm.toFixed(2)} />
          <StatBlock label="elev m" value={String(Math.round(summary.elevationGainM))} />
          <StatBlock label="avg km/h" value={summary.avgSpeedKmh.toFixed(1)} />
        </View>
      </View>

      {error ? (
        <Text style={{ color: theme.danger }}>{error}</Text>
      ) : null}

      <View style={{ flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' }}>
        {status === 'idle' || status === 'ended' ? (
          <Button label="Start" onPress={start} size="lg" fullWidth />
        ) : null}
        {status === 'recording' ? <Button label="Pause" variant="secondary" onPress={pause} /> : null}
        {status === 'paused' ? <Button label="Resume" onPress={resume} /> : null}
        {status === 'recording' || status === 'paused' ? (
          <Button label="Finish" variant="danger" onPress={stop} />
        ) : null}
      </View>

      {status === 'ended' ? (
        <View style={{ gap: spacing.md }}>
          <Input label="Title" placeholder="Cerro Tusa · 8 km loop" value={title} onChangeText={setTitle} />
          <Input
            label="Notes"
            placeholder="How did it feel? What did you see?"
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
          />
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <Button label="Save activity" loading={saving} onPress={handleSave} />
            <Button label="Discard" variant="ghost" onPress={reset} />
          </View>
          <Text style={{ color: theme.textMuted, fontSize: fontSizes.sm }}>
            {summary.distanceKm > 0
              ? `Pace: ${formatSpeedKmh(summary.distanceKm, elapsed)} · Duration ${formatDuration(elapsed)} · Elevation ${formatElevation(summary.elevationGainM)}`
              : ''}
          </Text>
        </View>
      ) : null}

      {savedMsg ? <Text style={{ color: theme.success }}>{savedMsg}</Text> : null}
    </Screen>
  );
}
