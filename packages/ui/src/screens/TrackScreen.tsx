import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { useTheme, spacing, fontSizes, fontWeights, radii } from '@minga/theme';
import { formatDuration, formatElevation, formatSpeedKmh } from '@minga/logic';
import { useT } from '@minga/i18n';
import type { ActivityType, TerrainTag } from '@minga/types';
import { fetchMyPurchasedExpeditions, getSupabase, saveActivity } from '@minga/supabase';
import { Screen } from '../primitives/Screen';
import { Button } from '../primitives/Button';
import { StatBlock } from '../primitives/StatBlock';
import { Input } from '../primitives/Input';
import { CategoryChip } from '../primitives/CategoryChip';
import { useTracker, type LocationAdapter, type LocationPermissionStatus } from '../hooks/useTracker';
import { SignInRequiredModal, isSignInRequiredError } from '../components/SignInRequiredModal';

const ACTIVITY_TYPES: ActivityType[] = ['hike', 'ride', 'run', 'walk'];
const ACT_KEY: Record<ActivityType, any> = {
  hike: 'track.actType.hike',
  ride: 'track.actType.ride',
  run: 'track.actType.run',
  walk: 'track.actType.walk',
};

const TERRAIN_TAGS: TerrainTag[] = ['mountain', 'flat', 'desert', 'river', 'forest', 'coast', 'urban', 'jungle', 'snow'];
const TERRAIN_KEY: Record<TerrainTag, any> = {
  mountain: 'track.terrain.mountain',
  flat: 'track.terrain.flat',
  desert: 'track.terrain.desert',
  river: 'track.terrain.river',
  forest: 'track.terrain.forest',
  coast: 'track.terrain.coast',
  urban: 'track.terrain.urban',
  jungle: 'track.terrain.jungle',
  snow: 'track.terrain.snow',
};

// Apps inject `locationAdapter` — see apps/mobile-web/src/locationAdapter.ts and apps/mobile/src/locationAdapter.ts.
export function TrackScreen({
  locationAdapter,
  onSignIn,
}: {
  locationAdapter: LocationAdapter;
  onSignIn?: () => void;
}) {
  const { theme } = useTheme();
  const { t, language } = useT();
  const { status, summary, elapsed, error, start, pause, resume, stop, reset, points } = useTracker(locationAdapter);
  const [activityType, setActivityType] = useState<ActivityType>('hike');
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);
  const [expeditionId, setExpeditionId] = useState<string | null>(null);
  const [purchased, setPurchased] = useState<{ id: string; title: string }[]>([]);
  const [terrain, setTerrain] = useState<TerrainTag[]>([]);
  const [signInPrompt, setSignInPrompt] = useState<string | null>(null);
  // Location permission gate. `undetermined` while we're still reading the OS
  // state on mount; the Start button only renders once this is `granted`.
  const [permission, setPermission] = useState<LocationPermissionStatus>('undetermined');
  const [requestingPermission, setRequestingPermission] = useState(false);

  const refreshPermission = async () => {
    try {
      const next = await locationAdapter.getPermissionStatus();
      setPermission(next);
      return next;
    } catch {
      setPermission('unsupported');
      return 'unsupported' as const;
    }
  };

  useEffect(() => {
    void refreshPermission();
    // refreshPermission is stable enough — locationAdapter is host-supplied
    // and effectively constant. Including it would cause a re-check on every
    // render in apps that build the adapter inline.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const requestPermission = async () => {
    setRequestingPermission(true);
    try {
      const next = await locationAdapter.requestPermission();
      setPermission(next);
    } catch {
      setPermission('unsupported');
    } finally {
      setRequestingPermission(false);
    }
  };

  const startGuarded = async () => {
    const { data } = await getSupabase().auth.getSession();
    if (!data.session) {
      setSignInPrompt(t('common.signInToTrack'));
      return;
    }
    // Belt-and-suspenders: re-check at start time in case the user toggled
    // the OS setting while the screen was mounted. Without a granted state
    // we hide the Start button entirely, so this branch is defensive.
    const current = await refreshPermission();
    if (current !== 'granted') return;
    start();
  };

  useEffect(() => {
    void fetchMyPurchasedExpeditions(getSupabase()).then(setPurchased).catch(() => undefined);
  }, []);

  const toggleTerrain = (tag: TerrainTag) => {
    setTerrain((prev) => (prev.includes(tag) ? prev.filter((x) => x !== tag) : [...prev, tag]));
  };

  const handleSave = async () => {
    setSaving(true);
    setSavedMsg(null);
    try {
      const locale = language === 'es' ? 'es-CO' : 'en-US';
      const fallbackTitle = `${t(ACT_KEY[activityType])} · ${new Date().toLocaleDateString(locale)}`;
      await saveActivity(getSupabase(), {
        activity_type: activityType,
        title: title.trim() || fallbackTitle,
        expedition_id: expeditionId,
        is_independent: expeditionId == null,
        terrain_tags: terrain,
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
      if (isSignInRequiredError(e)) setSignInPrompt(t('common.signInToTrack'));
      else setSavedMsg(e?.message ?? t('common.loadError'));
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

      {status === 'idle' || status === 'ended' ? (
        <View style={{ gap: spacing.xs }}>
          <Text style={{ color: theme.textMuted, fontSize: fontSizes.xs, letterSpacing: 1, textTransform: 'uppercase' }}>
            {t('track.linkedTo')}
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
            <CategoryChip
              label={t('track.independent')}
              active={expeditionId == null}
              onPress={() => setExpeditionId(null)}
            />
            {purchased.map((exp) => (
              <CategoryChip
                key={exp.id}
                label={exp.title}
                active={expeditionId === exp.id}
                onPress={() => setExpeditionId(exp.id)}
              />
            ))}
          </View>
        </View>
      ) : null}

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
          <StatBlock label={t('track.elevShort')} value={String(Math.round(summary.elevationGainM))} />
          <StatBlock label={t('track.avgSpeedShort')} value={summary.avgSpeedKmh.toFixed(1)} />
        </View>
      </View>

      {error ? <Text style={{ color: theme.danger }}>{error}</Text> : null}

      {(status === 'idle' || status === 'ended') && permission !== 'granted' ? (
        <LocationGate
          status={permission}
          loading={requestingPermission}
          onRequest={requestPermission}
          onRetry={refreshPermission}
          theme={theme}
          t={t}
        />
      ) : null}

      <View style={{ flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' }}>
        {(status === 'idle' || status === 'ended') && permission === 'granted' ? (
          <Button label={t('track.start')} onPress={startGuarded} size="lg" fullWidth />
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
          <Input label={t('track.titleLabel')} placeholder={t('track.titlePlaceholder')} value={title} onChangeText={setTitle} />
          <Input
            label={t('track.notesLabel')}
            placeholder={t('track.notesPlaceholder')}
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
          />

          <View style={{ gap: spacing.xs }}>
            <Text style={{ color: theme.textMuted, fontSize: fontSizes.xs, letterSpacing: 1, textTransform: 'uppercase' }}>
              {t('track.terrain')}
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
              {TERRAIN_TAGS.map((tag) => (
                <CategoryChip
                  key={tag}
                  label={t(TERRAIN_KEY[tag])}
                  active={terrain.includes(tag)}
                  onPress={() => toggleTerrain(tag)}
                />
              ))}
            </View>
          </View>

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

      <SignInRequiredModal
        visible={signInPrompt != null}
        message={signInPrompt ?? ''}
        onClose={() => setSignInPrompt(null)}
        onSignIn={onSignIn}
      />
    </Screen>
  );
}

// Hard gate shown in place of the Start button when location permission is
// anything other than `granted`. Recording an activity is meaningless without
// GPS, so we block the entry point instead of letting the user save a 0-km
// activity.
function LocationGate({
  status,
  loading,
  onRequest,
  onRetry,
  theme,
  t,
}: {
  status: LocationPermissionStatus;
  loading: boolean;
  onRequest: () => void | Promise<void>;
  onRetry: () => void | Promise<unknown>;
  theme: ReturnType<typeof useTheme>['theme'];
  t: ReturnType<typeof useT>['t'];
}) {
  if (status === 'unsupported') {
    return (
      <View
        style={{
          backgroundColor: theme.surfaceAlt,
          borderColor: theme.border,
          borderWidth: 1,
          borderRadius: radii.lg,
          padding: spacing.lg,
        }}
      >
        <Text style={{ color: theme.text, fontSize: fontSizes.md, lineHeight: 22 }}>
          {t('track.locationUnsupported')}
        </Text>
      </View>
    );
  }

  const isDenied = status === 'denied';
  const title = isDenied ? t('track.locationDeniedTitle') : t('track.locationGateTitle');
  const body = isDenied ? t('track.locationDeniedBody') : t('track.locationGateBody');
  const ctaLabel = isDenied ? t('track.locationDeniedRetry') : t('track.locationGateCta');
  const onPress = isDenied ? onRetry : onRequest;

  return (
    <View
      style={{
        backgroundColor: theme.primaryMuted,
        borderColor: theme.primary,
        borderWidth: 1,
        borderRadius: radii.lg,
        padding: spacing.lg,
        gap: spacing.sm,
      }}
    >
      <Text style={{ color: theme.text, fontSize: fontSizes.lg, fontWeight: fontWeights.bold }}>
        {title}
      </Text>
      <Text style={{ color: theme.text, fontSize: fontSizes.sm, lineHeight: 20 }}>{body}</Text>
      <Button label={ctaLabel} onPress={() => void onPress()} loading={loading} />
    </View>
  );
}
