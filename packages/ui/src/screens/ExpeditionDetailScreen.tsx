import React, { useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, Text, View } from 'react-native';
import { useTheme, spacing, fontSizes, fontWeights, radii } from '@minga/theme';
import {
  formatDistanceKm,
  formatElevation,
  formatPriceCents,
  formatSalidaRange,
  isSoldOut,
  priceCentsForSalida,
  seatsRemaining,
} from '@minga/logic';
import { useT } from '@minga/i18n';
import type { DbExpeditionSalida, ExpeditionCategory, ExpeditionWithAuthor } from '@minga/types';
import { Screen } from '../primitives/Screen';
import { Button } from '../primitives/Button';
import { Avatar } from '../primitives/Avatar';
import { TierBadge } from '../primitives/TierBadge';
import { CategoryChip } from '../primitives/CategoryChip';
import { Input } from '../primitives/Input';
import { StarRating } from '../primitives/StarRating';
import { Icon } from '../primitives/Icon';
import { CommentThread } from '../components/CommentThread';
import { PhotoAttribution } from '../components/PhotoAttribution';
import { EmptyState } from '../components/EmptyState';
import { SignInRequiredModal, isSignInRequiredError } from '../components/SignInRequiredModal';
import { useExpedition } from '../hooks/useExpedition';

const CATEGORY_KEY: Record<ExpeditionCategory, any> = {
  hiking: 'cat.hiking',
  cycling: 'cat.cycling',
  running: 'cat.running',
  trekking: 'cat.trekking',
  cultural: 'cat.cultural',
  wildlife: 'cat.wildlife',
  other: 'cat.other',
};

export function ExpeditionDetailScreen({
  id,
  onBack,
  onBookSalida,
  onSignIn,
}: {
  id: string;
  onBack?: () => void;
  // Called when the user taps "Book this date" on a specific salida. Hosts
  // wire this to their checkout — apps/mobile + apps/mobile-web push to the
  // shared CheckoutScreen. The full expedition is passed alongside so the
  // host can resolve title/price without re-fetching.
  onBookSalida?: (salida: DbExpeditionSalida, expedition: ExpeditionWithAuthor) => void;
  onSignIn?: () => void;
}) {
  const { theme } = useTheme();
  const { t } = useT();
  const { expedition, comments, salidas, loading, error, reply, rootComment, like, rate } = useExpedition(id);
  const [draft, setDraft] = useState('');
  const [posting, setPosting] = useState(false);
  const [myRating, setMyRating] = useState<number>(0);
  const [signInPrompt, setSignInPrompt] = useState<string | null>(null);

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
        <EmptyState iconName="flag" title={t('empty.notFound')} body={error ?? undefined} />
        {onBack ? <Button label={t('common.back')} onPress={onBack} variant="secondary" /> : null}
      </Screen>
    );
  }

  const postRoot = async () => {
    if (!draft.trim()) return;
    setPosting(true);
    try {
      await rootComment(draft.trim());
      setDraft('');
    } catch (e) {
      if (isSignInRequiredError(e)) setSignInPrompt(t('detail.signInToComment'));
    } finally {
      setPosting(false);
    }
  };

  const replyGuarded = async (parentId: string, body: string) => {
    try {
      await reply(parentId, body);
    } catch (e) {
      if (isSignInRequiredError(e)) setSignInPrompt(t('detail.signInToComment'));
      else throw e;
    }
  };

  return (
    <Screen>
      {onBack ? (
        <Pressable onPress={onBack} style={{ paddingTop: spacing.md }}>
          <Text style={{ color: theme.primary, fontWeight: fontWeights.semibold }}>{t('common.back')}</Text>
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
              <View
                style={{
                  position: 'absolute',
                  bottom: 8,
                  left: 8,
                  backgroundColor: theme.overlay,
                  padding: 4,
                  borderRadius: 4,
                }}
              >
                <PhotoAttribution attribution={p.attribution} />
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={{ flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' }}>
        <CategoryChip label={t(CATEGORY_KEY[expedition.category])} />
        {expedition.is_official ? (
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
          <Text style={{ color: theme.textMuted, fontSize: fontSizes.sm }}>@{expedition.author.username}</Text>
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
        <Stat
          theme={theme}
          label={t('stats.distance')}
          value={expedition.distance_km ? formatDistanceKm(expedition.distance_km) : '—'}
        />
        <Stat
          theme={theme}
          label={t('stats.elevation')}
          value={expedition.elevation_gain_m ? formatElevation(expedition.elevation_gain_m) : '—'}
        />
        <Stat
          theme={theme}
          label={t('stats.difficulty')}
          value={'●'.repeat(expedition.difficulty) + '○'.repeat(5 - expedition.difficulty)}
        />
        <Stat
          theme={theme}
          label={t('stats.price')}
          value={formatPriceCents(expedition.price_cents, {
            currency: expedition.currency,
            freeLabel: t('common.free'),
          })}
        />
      </View>

      <Text style={{ color: theme.text, fontSize: fontSizes.md, lineHeight: 24 }}>{expedition.description}</Text>

      <View style={{ gap: spacing.sm }}>
        <Text style={{ color: theme.text, fontWeight: fontWeights.bold, fontSize: fontSizes.lg }}>
          {t('salida.upcomingHeading')}
        </Text>
        {salidas.length === 0 ? (
          <Text style={{ color: theme.textMuted, fontSize: fontSizes.sm }}>{t('salida.empty')}</Text>
        ) : (
          <View style={{ gap: spacing.sm }}>
            {salidas.map((s) => {
              const sold = isSoldOut(s);
              const remaining = seatsRemaining(s);
              const { price_cents, currency } = priceCentsForSalida(s, expedition);
              return (
                <View
                  key={s.id}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: spacing.md,
                    backgroundColor: theme.surfaceAlt,
                    borderRadius: radii.lg,
                    padding: spacing.md,
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: theme.text, fontWeight: fontWeights.semibold }}>
                      {formatSalidaRange(s.starts_at, s.ends_at, { tz: s.timezone })}
                    </Text>
                    <Text style={{ color: theme.textMuted, fontSize: fontSizes.xs, marginTop: 2 }}>
                      {sold
                        ? t('salida.soldOut')
                        : remaining != null
                          ? t('salida.seatsRemaining', { n: remaining })
                          : t('salida.openCapacity')}
                      {' · '}
                      {formatPriceCents(price_cents, { currency, freeLabel: t('common.free') })}
                    </Text>
                  </View>
                  {onBookSalida ? (
                    <Button
                      label={t('salida.book')}
                      onPress={() => onBookSalida(s, expedition)}
                      disabled={sold}
                      variant={sold ? 'secondary' : 'primary'}
                    />
                  ) : null}
                </View>
              );
            })}
          </View>
        )}
      </View>

      <View style={{ flexDirection: 'row', gap: spacing.md, alignItems: 'center' }}>
        <Button
          label={`${expedition.likes_count}`}
          variant="secondary"
          leftIcon={<Icon name="heart" size={14} color={theme.text} strokeWidth={2.2} />}
          onPress={() => {
            void like().catch((e) => {
              if (isSignInRequiredError(e)) setSignInPrompt(t('detail.signInToLike'));
            });
          }}
        />
        <View style={{ flexDirection: 'row', gap: spacing.xs, alignItems: 'center' }}>
          <StarRating value={expedition.avg_rating ?? 0} />
          <Text style={{ color: theme.textMuted }}>
            {expedition.avg_rating ? expedition.avg_rating.toFixed(1) : t('detail.notRated')}
          </Text>
        </View>
      </View>

      <View style={{ gap: spacing.sm }}>
        <Text style={{ color: theme.text, fontWeight: fontWeights.semibold }}>{t('detail.rateTitle')}</Text>
        <StarRating
          value={myRating}
          size={fontSizes['2xl']}
          onChange={async (stars) => {
            setMyRating(stars);
            try {
              await rate(stars);
            } catch (e) {
              if (isSignInRequiredError(e)) setSignInPrompt(t('detail.signInToRate'));
            }
          }}
        />
      </View>

      <View style={{ gap: spacing.sm, marginTop: spacing.lg }}>
        <Text style={{ color: theme.text, fontSize: fontSizes.xl, fontWeight: fontWeights.bold }}>
          {t('detail.comments')} ({expedition.comments_count})
        </Text>
        <Input
          placeholder={t('detail.commentPlaceholder')}
          value={draft}
          onChangeText={setDraft}
          multiline
        />
        <Button label={t('detail.post')} loading={posting} onPress={postRoot} />
        <CommentThread comments={comments} onReply={replyGuarded} />
      </View>

      <SignInRequiredModal
        visible={signInPrompt != null}
        message={signInPrompt ?? ''}
        onClose={() => setSignInPrompt(null)}
        onSignIn={onSignIn}
      />
    </Screen>
  );
}

function Stat({ theme, label, value }: { theme: any; label: string; value: string }) {
  return (
    <View>
      <Text style={{ color: theme.text, fontSize: fontSizes.sm, fontWeight: fontWeights.bold }}>{value}</Text>
      <Text style={{ color: theme.textMuted, fontSize: 10, letterSpacing: 0.5, textTransform: 'uppercase' }}>
        {label}
      </Text>
    </View>
  );
}
