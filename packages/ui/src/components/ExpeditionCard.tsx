import React from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import { useTheme, radii, spacing, fontSizes, fontWeights } from '@minga/theme';
import { formatDistanceKm, formatElevation, formatPriceCents } from '@minga/logic';
import { useT } from '@minga/i18n';
import type { ExpeditionWithAuthor, ExpeditionCategory } from '@minga/types';
import { Avatar } from '../primitives/Avatar';
import { TierBadge } from '../primitives/TierBadge';
import { CategoryChip } from '../primitives/CategoryChip';
import { StarRating } from '../primitives/StarRating';
import { Icon } from '../primitives/Icon';

const CATEGORY_KEY: Record<ExpeditionCategory, any> = {
  hiking: 'cat.hiking',
  cycling: 'cat.cycling',
  running: 'cat.running',
  trekking: 'cat.trekking',
  cultural: 'cat.cultural',
  wildlife: 'cat.wildlife',
  other: 'cat.other',
};

export function ExpeditionCard({
  expedition,
  onPress,
  compact,
}: {
  expedition: ExpeditionWithAuthor;
  onPress?: () => void;
  compact?: boolean;
}) {
  const { theme } = useTheme();
  const { t } = useT();
  const coverUri = expedition.cover_photo_url ?? expedition.photos[0]?.url ?? null;

  return (
    <Pressable
      onPress={onPress}
      style={{
        backgroundColor: theme.surface,
        borderRadius: radii.lg,
        borderWidth: 1,
        borderColor: theme.border,
        overflow: 'hidden',
      }}
    >
      {coverUri ? (
        <View style={{ width: '100%', aspectRatio: compact ? 16 / 9 : 4 / 3, backgroundColor: theme.surfaceAlt }}>
          <Image source={{ uri: coverUri }} style={{ width: '100%', height: '100%' }} />
          <View style={{ position: 'absolute', top: spacing.md, left: spacing.md }}>
            <CategoryChip label={t(CATEGORY_KEY[expedition.category])} />
          </View>
          {expedition.is_official ? (
            <View style={{ position: 'absolute', top: spacing.md, right: spacing.md }}>
              <View
                style={{
                  backgroundColor: theme.accent,
                  paddingHorizontal: spacing.sm,
                  paddingVertical: 2,
                  borderRadius: radii.sm,
                }}
              >
                <Text style={{ color: '#fff', fontWeight: fontWeights.bold, fontSize: fontSizes.xs }}>
                  {t('common.official')}
                </Text>
              </View>
            </View>
          ) : null}
        </View>
      ) : null}
      <View style={{ padding: spacing.lg, gap: spacing.sm }}>
        <Text
          numberOfLines={2}
          style={{ color: theme.text, fontSize: fontSizes.lg, fontWeight: fontWeights.bold }}
        >
          {expedition.title}
        </Text>
        <Text numberOfLines={2} style={{ color: theme.textMuted, fontSize: fontSizes.sm }}>
          {expedition.location_name}
          {expedition.region ? `, ${expedition.region}` : ''}
        </Text>

        <View style={{ flexDirection: 'row', gap: spacing.lg, marginTop: spacing.xs, flexWrap: 'wrap' }}>
          {expedition.distance_km != null ? (
            <MiniStat label={t('stats.distance')} value={formatDistanceKm(expedition.distance_km)} theme={theme} />
          ) : null}
          {expedition.elevation_gain_m != null ? (
            <MiniStat label={t('stats.elevation')} value={formatElevation(expedition.elevation_gain_m)} theme={theme} />
          ) : null}
          <MiniStat
            label={t('stats.difficulty')}
            value={'●'.repeat(expedition.difficulty) + '○'.repeat(5 - expedition.difficulty)}
            theme={theme}
          />
        </View>

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: spacing.md,
            paddingTop: spacing.sm,
            borderTopWidth: 1,
            borderTopColor: theme.border,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1 }}>
            <Avatar uri={expedition.author.avatar_url} name={expedition.author.display_name} size={28} />
            <Text numberOfLines={1} style={{ color: theme.text, fontSize: fontSizes.sm, flex: 1 }}>
              {expedition.author.display_name}
            </Text>
            <TierBadge tier={expedition.author.tier} />
          </View>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.lg, marginTop: spacing.xs }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
            <StarRating value={expedition.avg_rating ?? 0} />
            <Text style={{ color: theme.textMuted, fontSize: fontSizes.xs }}>
              {expedition.avg_rating ? expedition.avg_rating.toFixed(1) : '—'}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Icon name="heart" size={14} color={theme.textMuted} strokeWidth={2.2} />
              <Text style={{ color: theme.textMuted, fontSize: fontSizes.xs }}>{expedition.likes_count}</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Icon name="message" size={14} color={theme.textMuted} strokeWidth={2.2} />
              <Text style={{ color: theme.textMuted, fontSize: fontSizes.xs }}>{expedition.comments_count}</Text>
            </View>
          </View>
          <View style={{ flex: 1 }} />
          <Text style={{ color: theme.primary, fontWeight: fontWeights.bold, fontSize: fontSizes.sm }}>
            {formatPriceCents(expedition.price_cents, { currency: expedition.currency, freeLabel: t('common.free') })}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

function MiniStat({ label, value, theme }: { label: string; value: string; theme: any }) {
  return (
    <View>
      <Text style={{ color: theme.text, fontSize: fontSizes.sm, fontWeight: fontWeights.semibold }}>{value}</Text>
      <Text style={{ color: theme.textMuted, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 }}>
        {label}
      </Text>
    </View>
  );
}
