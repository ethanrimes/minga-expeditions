import React, { useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, Text, View } from 'react-native';
import { useTheme, spacing, fontSizes, fontWeights, radii } from '@minga/theme';
import { formatDistanceKm, formatElevation, formatPriceCents } from '@minga/logic';
import { Screen } from '../primitives/Screen';
import { Button } from '../primitives/Button';
import { Avatar } from '../primitives/Avatar';
import { TierBadge } from '../primitives/TierBadge';
import { CategoryChip } from '../primitives/CategoryChip';
import { Input } from '../primitives/Input';
import { StarRating } from '../primitives/StarRating';
import { CommentThread } from '../components/CommentThread';
import { PhotoAttribution } from '../components/PhotoAttribution';
import { EmptyState } from '../components/EmptyState';
import { useExpedition } from '../hooks/useExpedition';

export function ExpeditionDetailScreen({
  id,
  onBack,
}: {
  id: string;
  onBack?: () => void;
}) {
  const { theme } = useTheme();
  const { expedition, comments, loading, error, reply, rootComment, like, rate } = useExpedition(id);
  const [draft, setDraft] = useState('');
  const [posting, setPosting] = useState(false);
  const [myRating, setMyRating] = useState<number>(0);

  if (loading && !expedition) {
    return (
      <Screen>
        <ActivityIndicator />
      </Screen>
    );
  }

  if (error || !expedition) {
    return (
      <Screen>
        <EmptyState icon="⚠️" title="Expedition not found" body={error ?? undefined} />
        {onBack ? <Button label="Go back" onPress={onBack} variant="secondary" /> : null}
      </Screen>
    );
  }

  const postRoot = async () => {
    if (!draft.trim()) return;
    setPosting(true);
    try {
      await rootComment(draft.trim());
      setDraft('');
    } finally {
      setPosting(false);
    }
  };

  return (
    <Screen>
      {onBack ? (
        <Pressable onPress={onBack} style={{ paddingTop: spacing.md }}>
          <Text style={{ color: theme.primary, fontWeight: fontWeights.semibold }}>← Back</Text>
        </Pressable>
      ) : null}

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          {expedition.photos.map((p) => (
            <View
              key={p.id}
              style={{
                width: 280,
                aspectRatio: 4 / 3,
                borderRadius: radii.lg,
                overflow: 'hidden',
                backgroundColor: theme.surfaceAlt,
              }}
            >
              <Image source={{ uri: p.url }} style={{ width: '100%', height: '100%' }} />
              <View style={{ position: 'absolute', bottom: 8, left: 8, backgroundColor: theme.overlay, padding: 4, borderRadius: 4 }}>
                <PhotoAttribution attribution={p.attribution} />
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={{ flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' }}>
        <CategoryChip label={expedition.category} />
        {expedition.is_official ? (
          <View style={{ backgroundColor: theme.accent, paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radii.sm }}>
            <Text style={{ color: '#fff', fontWeight: fontWeights.bold, fontSize: fontSizes.xs }}>MINGA OFFICIAL</Text>
          </View>
        ) : null}
      </View>

      <Text style={{ color: theme.text, fontSize: fontSizes['2xl'], fontWeight: fontWeights.heavy }}>
        {expedition.title}
      </Text>
      <Text style={{ color: theme.textMuted, fontSize: fontSizes.md }}>
        {expedition.location_name}
        {expedition.region ? `, ${expedition.region}` : ''}, {expedition.country}
      </Text>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
        <Avatar uri={expedition.author.avatar_url} name={expedition.author.display_name} size={40} />
        <View style={{ flex: 1 }}>
          <Text style={{ color: theme.text, fontWeight: fontWeights.semibold }}>
            {expedition.author.display_name}
          </Text>
          <Text style={{ color: theme.textMuted, fontSize: fontSizes.sm }}>
            @{expedition.author.username}
          </Text>
        </View>
        <TierBadge tier={expedition.author.tier} />
      </View>

      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          padding: spacing.md,
          backgroundColor: theme.surfaceAlt,
          borderRadius: radii.lg,
        }}
      >
        <Stat theme={theme} label="Distance" value={expedition.distance_km ? formatDistanceKm(expedition.distance_km) : '—'} />
        <Stat theme={theme} label="Elevation" value={expedition.elevation_gain_m ? formatElevation(expedition.elevation_gain_m) : '—'} />
        <Stat theme={theme} label="Difficulty" value={'●'.repeat(expedition.difficulty) + '○'.repeat(5 - expedition.difficulty)} />
        <Stat theme={theme} label="Price" value={formatPriceCents(expedition.price_cents, expedition.currency)} />
      </View>

      <Text style={{ color: theme.text, fontSize: fontSizes.md, lineHeight: 24 }}>
        {expedition.description}
      </Text>

      <View style={{ flexDirection: 'row', gap: spacing.md, alignItems: 'center' }}>
        <Button label={`♥ ${expedition.likes_count}`} variant="secondary" onPress={() => void like()} />
        <View style={{ flexDirection: 'row', gap: spacing.xs, alignItems: 'center' }}>
          <StarRating value={expedition.avg_rating ?? 0} />
          <Text style={{ color: theme.textMuted }}>
            {expedition.avg_rating ? expedition.avg_rating.toFixed(1) : 'Not yet rated'}
          </Text>
        </View>
      </View>

      <View style={{ gap: spacing.sm }}>
        <Text style={{ color: theme.text, fontWeight: fontWeights.semibold }}>Rate this expedition</Text>
        <StarRating
          value={myRating}
          size={fontSizes['2xl']}
          onChange={async (stars) => {
            setMyRating(stars);
            await rate(stars);
          }}
        />
      </View>

      <View style={{ gap: spacing.sm, marginTop: spacing.lg }}>
        <Text style={{ color: theme.text, fontSize: fontSizes.xl, fontWeight: fontWeights.bold }}>
          Comments ({expedition.comments_count})
        </Text>
        <Input placeholder="Share a tip, question, or trip report…" value={draft} onChangeText={setDraft} multiline />
        <Button label="Post comment" loading={posting} onPress={postRoot} />
        <CommentThread comments={comments} onReply={reply} />
      </View>
    </Screen>
  );
}

function Stat({ theme, label, value }: { theme: any; label: string; value: string }) {
  return (
    <View>
      <Text style={{ color: theme.text, fontSize: fontSizes.sm, fontWeight: fontWeights.bold }}>{value}</Text>
      <Text style={{ color: theme.textMuted, fontSize: 10, letterSpacing: 0.5, textTransform: 'uppercase' }}>{label}</Text>
    </View>
  );
}
