import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { useTheme, spacing, fontSizes, fontWeights, radii } from '@minga/theme';
import { useT } from '@minga/i18n';
import {
  deleteActivityComment,
  fetchActivityById,
  fetchActivityComments,
  fetchActivityRating,
  fetchActivityTrack,
  getSupabase,
  postActivityComment,
  upsertActivityRating,
} from '@minga/supabase';
import { formatDistanceKm, formatDuration, formatElevation, formatSpeedKmh, relativeTime } from '@minga/logic';
import type {
  ActivityType,
  DbActivity,
  DbActivityComment,
  DbActivityRating,
} from '@minga/types';
import { Screen } from '../primitives/Screen';
import { Button } from '../primitives/Button';
import { Input } from '../primitives/Input';
import { StarRating } from '../primitives/StarRating';
import { StatBlock } from '../primitives/StatBlock';
import { Icon, type IconName } from '../primitives/Icon';
import { EmptyState } from '../components/EmptyState';

const ACT_LABEL_KEY: Record<ActivityType, any> = {
  hike: 'track.actType.hike',
  ride: 'track.actType.ride',
  run: 'track.actType.run',
  walk: 'track.actType.walk',
};

const ACT_ICON: Record<ActivityType, IconName> = {
  hike: 'mountain',
  ride: 'bike',
  run: 'footprints',
  walk: 'person',
};

// Props: the app injects its own map component because MapLibre GL JS runs
// differently on each platform (native via WebView, web directly). The
// screen owns fetching + comments + rating UI; the map is a dumb slot.
export interface ActivityMapProps {
  track: [number, number][];
  primary: string;
  surfaceAlt: string;
  border: string;
  loadingLabel: string;
}

export function ActivityDetailScreen({
  id,
  onBack,
  onOpenExpedition,
  MapComponent,
}: {
  id: string;
  onBack?: () => void;
  onOpenExpedition?: (expeditionId: string) => void;
  MapComponent: React.ComponentType<ActivityMapProps>;
}) {
  const { theme } = useTheme();
  const { t, language } = useT();
  const locale = language === 'es' ? 'es-CO' : 'en-US';

  const [activity, setActivity] = useState<DbActivity | null>(null);
  const [track, setTrack] = useState<[number, number][]>([]);
  const [comments, setComments] = useState<DbActivityComment[]>([]);
  const [rating, setRating] = useState<DbActivityRating | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [posting, setPosting] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [act, tk, cm, rt] = await Promise.all([
        fetchActivityById(getSupabase(), id),
        fetchActivityTrack(getSupabase(), id),
        fetchActivityComments(getSupabase(), id).catch(() => []),
        fetchActivityRating(getSupabase(), id).catch(() => null),
      ]);
      setActivity(act);
      setTrack(tk);
      setComments(cm);
      setRating(rt);
    } catch (e: any) {
      setError(e?.message ?? t('common.loadError'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [id]);

  if (loading && !activity) {
    return (
      <Screen>
        <ActivityIndicator />
      </Screen>
    );
  }

  if (!activity) {
    return (
      <Screen>
        <EmptyState iconName="map" title={t('activity.notFound')} body={error ?? undefined} />
        {onBack ? <Button label={t('common.back')} onPress={onBack} variant="secondary" /> : null}
      </Screen>
    );
  }

  const post = async () => {
    if (!draft.trim()) return;
    setPosting(true);
    try {
      await postActivityComment(getSupabase(), { activity_id: id, body: draft.trim() });
      setDraft('');
      await load();
    } catch (e: any) {
      setError(e?.message ?? t('common.loadError'));
    } finally {
      setPosting(false);
    }
  };

  const remove = async (cid: string) => {
    try {
      await deleteActivityComment(getSupabase(), cid);
      await load();
    } catch (e: any) {
      setError(e?.message ?? t('common.loadError'));
    }
  };

  const rate = async (stars: 1 | 2 | 3 | 4 | 5) => {
    try {
      await upsertActivityRating(getSupabase(), { activity_id: id, stars });
      await load();
    } catch (e: any) {
      setError(e?.message ?? t('common.loadError'));
    }
  };

  const pace =
    activity.distance_km > 0 && activity.duration_seconds > 0
      ? formatSpeedKmh(activity.distance_km, activity.duration_seconds)
      : '—';

  return (
    <Screen>
      {onBack ? (
        <Pressable onPress={onBack} style={{ paddingTop: spacing.md }}>
          <Text style={{ color: theme.primary, fontWeight: fontWeights.semibold }}>{t('common.back')}</Text>
        </Pressable>
      ) : null}

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: radii.md,
            backgroundColor: theme.primaryMuted,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon name={ACT_ICON[activity.activity_type]} size={24} color={theme.primary} strokeWidth={2.2} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: theme.text, fontSize: fontSizes['2xl'], fontWeight: fontWeights.heavy }}>
            {activity.title}
          </Text>
          <Text style={{ color: theme.textMuted, fontSize: fontSizes.sm }}>
            {t(ACT_LABEL_KEY[activity.activity_type])} · {new Date(activity.started_at).toLocaleDateString(locale)}
          </Text>
        </View>
      </View>

      <View
        style={{
          height: 260,
          borderRadius: radii.lg,
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: theme.border,
          backgroundColor: theme.surfaceAlt,
        }}
      >
        <MapComponent
          track={track}
          primary={theme.primary}
          surfaceAlt={theme.surfaceAlt}
          border={theme.border}
          loadingLabel={t('map.loading')}
        />
      </View>

      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-around',
          backgroundColor: theme.surfaceAlt,
          padding: spacing.lg,
          borderRadius: radii.lg,
          flexWrap: 'wrap',
          gap: spacing.sm,
        }}
      >
        <StatBlock label={t('stats.distance')} value={formatDistanceKm(activity.distance_km)} />
        <StatBlock label={t('stats.duration')} value={formatDuration(activity.duration_seconds)} />
        <StatBlock label={t('stats.elevation')} value={formatElevation(activity.elevation_gain_m)} />
        <StatBlock label={t('feed.pace')} value={pace} />
      </View>

      {activity.notes ? (
        <Text style={{ color: theme.text, fontSize: fontSizes.md, lineHeight: 22 }}>{activity.notes}</Text>
      ) : null}

      {activity.expedition_id ? (
        <Button
          label={t('activity.openExpedition')}
          variant="secondary"
          onPress={() => onOpenExpedition?.(activity.expedition_id!)}
        />
      ) : (
        <Text style={{ color: theme.textMuted, fontStyle: 'italic', fontSize: fontSizes.sm }}>
          {t('activity.noLinkedExpedition')}
        </Text>
      )}

      <View style={{ gap: spacing.sm }}>
        <Text style={{ color: theme.text, fontSize: fontSizes.lg, fontWeight: fontWeights.bold }}>
          {t('activity.rateHeading')}
        </Text>
        <StarRating value={rating?.stars ?? 0} size={fontSizes['2xl']} onChange={(s) => void rate(s)} />
      </View>

      <View style={{ gap: spacing.sm }}>
        <Text style={{ color: theme.text, fontSize: fontSizes.lg, fontWeight: fontWeights.bold }}>
          {t('activity.commentsHeading')} ({comments.length})
        </Text>
        <Input placeholder={t('activity.commentPlaceholder')} value={draft} onChangeText={setDraft} multiline />
        <Button label={t('detail.post')} loading={posting} onPress={post} size="sm" />

        <View style={{ gap: spacing.sm, marginTop: spacing.sm }}>
          {comments.map((c) => (
            <View
              key={c.id}
              style={{
                backgroundColor: theme.surface,
                borderRadius: radii.md,
                borderWidth: 1,
                borderColor: theme.border,
                padding: spacing.md,
                gap: spacing.xs,
              }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ color: theme.textMuted, fontSize: fontSizes.xs }}>
                  {relativeTime(c.created_at, language)}
                </Text>
                <Pressable onPress={() => remove(c.id)}>
                  <Icon name="x" size={14} color={theme.danger} strokeWidth={2.5} />
                </Pressable>
              </View>
              <Text style={{ color: theme.text, fontSize: fontSizes.md, lineHeight: 22 }}>{c.body}</Text>
            </View>
          ))}
        </View>
      </View>

      {error ? <Text style={{ color: theme.danger, fontSize: fontSizes.sm }}>{error}</Text> : null}
    </Screen>
  );
}
