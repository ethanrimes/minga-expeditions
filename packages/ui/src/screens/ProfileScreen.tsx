import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, Text, TextInput, View } from 'react-native';
import { useTheme, spacing, fontSizes, fontWeights, radii } from '@minga/theme';
import { fetchProfile, getSupabase, updateMyProfile, uploadAvatar } from '@minga/supabase';
import { formatDistanceKm, formatElevation } from '@minga/logic';
import { useT } from '@minga/i18n';
import type { DbProfile } from '@minga/types';
import { Screen } from '../primitives/Screen';
import { Avatar } from '../primitives/Avatar';
import { Button } from '../primitives/Button';
import { TierBadge } from '../primitives/TierBadge';
import { StatBlock } from '../primitives/StatBlock';
import { ActivityCard } from '../components/ActivityCard';
import { SectionHeader } from '../components/SectionHeader';
import { EmptyState } from '../components/EmptyState';
import { TierProgress } from '../components/TierProgress';
import { useAuth } from '../hooks/useAuth';
import { useMyActivities } from '../hooks/useMyActivities';
import type { ActivityPhotoPicker } from './ActivityDetailScreen';

// Keep this list in sync with apps/web/src/components/CheckoutDrawer.tsx +
// apps/web/src/pages/ProfilePage.tsx so the country-code picker is
// consistent across surfaces. Colombia first (launch market).
const COUNTRY_CODES = ['+57', '+1', '+52', '+593', '+51', '+56', '+54', '+55', '+58', '+591', '+34', '+44'];

// Brand names (Facebook, Google, Apple, GitHub) stay as-is across locales;
// `email` and `anonymous` are translated at render time via the dictionary.
const PROVIDER_LABELS: Record<string, string> = {
  facebook: 'Facebook',
  google: 'Google',
  apple: 'Apple',
  github: 'GitHub',
};

export function ProfileScreen({
  onSignIn,
  onOpenActivity,
  photoPicker,
}: {
  onSignIn?: () => void;
  onOpenActivity?: (activityId: string) => void;
  // Same shape used by ActivityDetailScreen so each host app injects one
  // adapter (expo-image-picker on native, hidden <input> on mobile-web).
  photoPicker?: ActivityPhotoPicker;
}) {
  const { theme } = useTheme();
  const { t } = useT();
  const { user, signOut, loading: authLoading } = useAuth();
  const { activities, loading: actsLoading } = useMyActivities();
  const [profile, setProfile] = useState<DbProfile | null>(null);
  const [phoneCode, setPhoneCode] = useState<string>('+57');
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [phoneSaveState, setPhoneSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [displayName, setDisplayName] = useState<string>('');
  const [nameSaveState, setNameSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [instagramHandle, setInstagramHandle] = useState<string>('');
  const [igSaveState, setIgSaveState] = useState<'idle' | 'saving' | 'saved' | 'error' | 'invalid'>('idle');
  const [avatarState, setAvatarState] = useState<'idle' | 'uploading' | 'error'>('idle');

  useEffect(() => {
    if (!user) return;
    fetchProfile(getSupabase(), user.id).then((p) => {
      setProfile(p);
      if (p?.display_name) setDisplayName(p.display_name);
    });
    // Fetch phone + instagram fields directly — fetchProfile returns the
    // typed DbProfile shape which doesn't include these columns yet, so we
    // read once here.
    void getSupabase()
      .from('profiles')
      .select('phone_country_code, phone_number, instagram_handle')
      .eq('id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        const p = data as {
          phone_country_code: string | null;
          phone_number: string | null;
          instagram_handle: string | null;
        } | null;
        if (p?.phone_country_code) setPhoneCode(p.phone_country_code);
        if (p?.phone_number) setPhoneNumber(p.phone_number);
        if (p?.instagram_handle) setInstagramHandle(p.instagram_handle);
      });
  }, [user?.id]);

  const savePhone = async () => {
    if (!user?.id) return;
    setPhoneSaveState('saving');
    const trimmed = phoneNumber.replace(/\D/g, '');
    const { error } = await getSupabase()
      .from('profiles')
      .update({ phone_country_code: phoneCode, phone_number: trimmed || null })
      .eq('id', user.id);
    if (error) {
      setPhoneSaveState('error');
      return;
    }
    setPhoneNumber(trimmed);
    setPhoneSaveState('saved');
    setTimeout(() => setPhoneSaveState('idle'), 2000);
  };

  const saveDisplayName = async () => {
    if (!user?.id) return;
    const trimmed = displayName.trim();
    if (!trimmed || trimmed === profile?.display_name) return;
    setNameSaveState('saving');
    try {
      const updated = await updateMyProfile(getSupabase(), { display_name: trimmed });
      setProfile(updated);
      setDisplayName(updated.display_name);
      setNameSaveState('saved');
      setTimeout(() => setNameSaveState('idle'), 2000);
    } catch {
      setNameSaveState('error');
    }
  };

  const saveInstagram = async () => {
    if (!user?.id) return;
    const normalized = instagramHandle.replace(/^@+/, '').trim().toLowerCase();
    if (normalized && !/^[a-z0-9._]{1,30}$/.test(normalized)) {
      setIgSaveState('invalid');
      return;
    }
    setIgSaveState('saving');
    try {
      const updated = await updateMyProfile(getSupabase(), { instagram_handle: normalized });
      setProfile(updated);
      setInstagramHandle(normalized);
      setIgSaveState('saved');
      setTimeout(() => setIgSaveState('idle'), 2000);
    } catch {
      setIgSaveState('error');
    }
  };

  const changeAvatar = async () => {
    if (!user?.id || !photoPicker) return;
    setAvatarState('uploading');
    try {
      const picked = await photoPicker.pickPhoto();
      if (!picked) {
        setAvatarState('idle');
        return;
      }
      const url = await uploadAvatar(getSupabase(), picked.blob, picked.filename);
      const updated = await updateMyProfile(getSupabase(), { avatar_url: url });
      setProfile(updated);
      setAvatarState('idle');
    } catch {
      setAvatarState('error');
    }
  };

  const identities = (user?.identities ?? []) as Array<{ provider: string }>;
  const identityProviders = Array.from(
    new Set(
      identities.length
        ? identities.map((i) => i.provider)
        : ((user?.app_metadata?.providers as string[] | undefined) ?? []),
    ),
  );

  if (authLoading) {
    return (
      <Screen>
        <ActivityIndicator />
      </Screen>
    );
  }

  if (!user) {
    return (
      <Screen>
        <EmptyState iconName="user" title={t('profile.signInTitle')} body={t('profile.signInBody')} />
        <Button label={t('auth.signIn')} onPress={onSignIn} />
      </Screen>
    );
  }

  return (
    <Screen>
      <View
        style={{
          flexDirection: 'row',
          gap: spacing.lg,
          alignItems: 'center',
          paddingTop: spacing.xl,
        }}
      >
        <View style={{ alignItems: 'center', gap: spacing.xs }}>
          <Avatar uri={profile?.avatar_url} name={profile?.display_name ?? user.email} size={72} />
          {photoPicker ? (
            <Pressable
              onPress={() => void changeAvatar()}
              disabled={avatarState === 'uploading'}
              style={{
                paddingHorizontal: spacing.sm,
                paddingVertical: spacing.xs,
                borderRadius: radii.pill,
                backgroundColor: theme.surfaceAlt,
                borderColor: theme.border,
                borderWidth: 1,
                opacity: avatarState === 'uploading' ? 0.7 : 1,
              }}
            >
              <Text style={{ color: theme.text, fontSize: fontSizes.sm, fontWeight: fontWeights.bold }}>
                {avatarState === 'uploading'
                  ? t('profile.uploadingPhoto')
                  : avatarState === 'error'
                    ? t('profile.uploadFailed')
                    : t('profile.changePhoto')}
              </Text>
            </Pressable>
          ) : null}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: theme.text, fontSize: fontSizes.xl, fontWeight: fontWeights.bold }}>
            {profile?.display_name ?? user.email}
          </Text>
          <Text style={{ color: theme.textMuted }}>@{profile?.username ?? user.email?.split('@')[0]}</Text>
          {profile ? (
            <View style={{ marginTop: spacing.xs }}>
              <TierBadge tier={profile.tier} />
            </View>
          ) : null}
        </View>
      </View>

      <View
        style={{
          backgroundColor: theme.surface,
          borderRadius: radii.lg,
          borderWidth: 1,
          borderColor: theme.border,
          padding: spacing.lg,
          gap: spacing.xs,
        }}
      >
        <Text style={{ color: theme.text, fontWeight: fontWeights.bold }}>
          {t('profile.displayNameLabel')}
        </Text>
        <Text style={{ color: theme.textMuted, fontSize: fontSizes.sm }}>
          {t('profile.displayNameHelp')}
        </Text>
        <TextInput
          value={displayName}
          onChangeText={setDisplayName}
          onBlur={() => void saveDisplayName()}
          placeholder={profile?.username ?? ''}
          placeholderTextColor={theme.textMuted}
          maxLength={80}
          style={{
            backgroundColor: theme.surfaceAlt,
            color: theme.text,
            borderColor: theme.border,
            borderWidth: 1,
            borderRadius: radii.md,
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.sm,
            marginTop: spacing.xs,
            fontSize: fontSizes.md,
          }}
        />
        {nameSaveState !== 'idle' ? (
          <Text style={{ color: nameSaveState === 'error' ? theme.danger : theme.textMuted, fontSize: fontSizes.sm }}>
            {nameSaveState === 'saving'
              ? t('profile.phoneSaving')
              : nameSaveState === 'saved'
                ? t('profile.phoneSaved')
                : t('profile.phoneRetry')}
          </Text>
        ) : null}
      </View>

      {profile?.bio ? <Text style={{ color: theme.text }}>{profile.bio}</Text> : null}

      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-around',
          backgroundColor: theme.surfaceAlt,
          padding: spacing.lg,
          borderRadius: radii.lg,
        }}
      >
        <StatBlock label={t('stats.totalKm')} value={formatDistanceKm(profile?.total_distance_km ?? 0)} />
        <StatBlock label={t('stats.elevation')} value={formatElevation(profile?.total_elevation_m ?? 0)} />
        <StatBlock label={t('stats.activities')} value={String(activities.length)} />
      </View>

      {profile ? <TierProgress distanceKm={profile.total_distance_km} /> : null}

      <SectionHeader title={t('profile.connectedAccounts')} />
      <View
        style={{
          backgroundColor: theme.surface,
          borderRadius: radii.lg,
          borderWidth: 1,
          borderColor: theme.border,
          padding: spacing.lg,
          gap: spacing.md,
        }}
      >
        <View>
          <Text style={{ color: theme.text, fontWeight: fontWeights.bold }}>{t('profile.emailLabel')}</Text>
          <Text style={{ color: theme.text }}>{user.email ?? '—'}</Text>
        </View>
        <View>
          <Text style={{ color: theme.text, fontWeight: fontWeights.bold }}>{t('profile.signInMethodLabel')}</Text>
          <Text style={{ color: theme.text }}>
            {identityProviders.length
              ? identityProviders
                  .map((p) =>
                    p === 'email'
                      ? t('profile.signInMethodEmailPassword')
                      : p === 'anonymous'
                        ? t('profile.signInMethodGuest')
                        : (PROVIDER_LABELS[p] ?? p),
                  )
                  .join(' · ')
              : t('profile.signInMethodEmailPassword')}
          </Text>
        </View>
        <View>
          <Text style={{ color: theme.text, fontWeight: fontWeights.bold, marginBottom: spacing.xs }}>
            {t('profile.whatsappLabel')}
          </Text>
          <Text style={{ color: theme.textMuted, fontSize: fontSizes.sm, marginBottom: spacing.sm }}>
            {t('profile.whatsappHelp')}
          </Text>
          <View style={{ flexDirection: 'row', gap: spacing.xs, flexWrap: 'wrap' }}>
            {COUNTRY_CODES.map((c) => {
              const active = c === phoneCode;
              return (
                <Pressable
                  key={c}
                  onPress={() => setPhoneCode(c)}
                  style={{
                    backgroundColor: active ? theme.primary : theme.surfaceAlt,
                    borderColor: active ? theme.primary : theme.border,
                    borderWidth: 1,
                    paddingHorizontal: spacing.sm,
                    paddingVertical: spacing.xs,
                    borderRadius: radii.pill,
                  }}
                >
                  <Text
                    style={{
                      color: active ? theme.onPrimary : theme.text,
                      fontWeight: fontWeights.bold,
                      fontSize: fontSizes.sm,
                    }}
                  >
                    {c}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <TextInput
            value={phoneNumber}
            onChangeText={(v) => setPhoneNumber(v.replace(/\D/g, ''))}
            keyboardType="phone-pad"
            placeholder="3001234567"
            placeholderTextColor={theme.textMuted}
            style={{
              backgroundColor: theme.surfaceAlt,
              color: theme.text,
              borderColor: theme.border,
              borderWidth: 1,
              borderRadius: radii.md,
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.sm,
              marginTop: spacing.sm,
              fontSize: fontSizes.md,
            }}
          />
          <Pressable
            onPress={() => void savePhone()}
            disabled={phoneSaveState === 'saving'}
            style={{
              alignSelf: 'flex-start',
              marginTop: spacing.sm,
              backgroundColor: phoneSaveState === 'saved' ? theme.surfaceAlt : theme.primary,
              borderColor: phoneSaveState === 'saved' ? theme.border : 'transparent',
              borderWidth: phoneSaveState === 'saved' ? 1 : 0,
              paddingHorizontal: spacing.lg,
              paddingVertical: spacing.sm,
              borderRadius: radii.pill,
              opacity: phoneSaveState === 'saving' ? 0.7 : 1,
            }}
          >
            <Text
              style={{
                color: phoneSaveState === 'saved' ? theme.text : theme.onPrimary,
                fontWeight: fontWeights.bold,
                fontSize: fontSizes.sm,
              }}
            >
              {phoneSaveState === 'saving'
                ? t('profile.phoneSaving')
                : phoneSaveState === 'saved'
                ? t('profile.phoneSaved')
                : phoneSaveState === 'error'
                ? t('profile.phoneRetry')
                : t('profile.phoneSave')}
            </Text>
          </Pressable>
        </View>
        <View>
          <Text style={{ color: theme.text, fontWeight: fontWeights.bold, marginBottom: spacing.xs }}>
            {t('profile.instagramLabel')}
          </Text>
          <Text style={{ color: theme.textMuted, fontSize: fontSizes.sm, marginBottom: spacing.sm }}>
            {t('profile.instagramHelp')}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
            <View
              style={{
                backgroundColor: theme.surfaceAlt,
                borderColor: theme.border,
                borderWidth: 1,
                borderTopLeftRadius: radii.md,
                borderBottomLeftRadius: radii.md,
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.sm,
              }}
            >
              <Text style={{ color: theme.textMuted, fontSize: fontSizes.md }}>@</Text>
            </View>
            <TextInput
              value={instagramHandle}
              onChangeText={(v) => {
                setInstagramHandle(v.replace(/^@+/, '').toLowerCase());
                if (igSaveState === 'invalid') setIgSaveState('idle');
              }}
              autoCapitalize="none"
              autoCorrect={false}
              placeholder={t('profile.instagramPlaceholder')}
              placeholderTextColor={theme.textMuted}
              maxLength={30}
              style={{
                flex: 1,
                backgroundColor: theme.surfaceAlt,
                color: theme.text,
                borderColor: theme.border,
                borderWidth: 1,
                borderLeftWidth: 0,
                borderTopRightRadius: radii.md,
                borderBottomRightRadius: radii.md,
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.sm,
                fontSize: fontSizes.md,
              }}
            />
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.sm }}>
            <Pressable
              onPress={() => void saveInstagram()}
              disabled={igSaveState === 'saving'}
              style={{
                backgroundColor: igSaveState === 'saved' ? theme.surfaceAlt : theme.primary,
                borderColor: igSaveState === 'saved' ? theme.border : 'transparent',
                borderWidth: igSaveState === 'saved' ? 1 : 0,
                paddingHorizontal: spacing.lg,
                paddingVertical: spacing.sm,
                borderRadius: radii.pill,
                opacity: igSaveState === 'saving' ? 0.7 : 1,
              }}
            >
              <Text
                style={{
                  color: igSaveState === 'saved' ? theme.text : theme.onPrimary,
                  fontWeight: fontWeights.bold,
                  fontSize: fontSizes.sm,
                }}
              >
                {igSaveState === 'saving'
                  ? t('profile.phoneSaving')
                  : igSaveState === 'saved'
                    ? t('profile.phoneSaved')
                    : igSaveState === 'error' || igSaveState === 'invalid'
                      ? t('profile.phoneRetry')
                      : t('profile.phoneSave')}
              </Text>
            </Pressable>
            {instagramHandle && profile?.instagram_handle === instagramHandle ? (
              <Pressable
                onPress={() => void Linking.openURL(`https://instagram.com/${instagramHandle}`)}
                style={{
                  paddingHorizontal: spacing.sm,
                  paddingVertical: spacing.xs,
                }}
              >
                <Text style={{ color: theme.primary, fontWeight: fontWeights.bold, fontSize: fontSizes.sm }}>
                  {t('profile.instagramOpen')}
                </Text>
              </Pressable>
            ) : null}
          </View>
          {igSaveState === 'invalid' ? (
            <Text style={{ color: theme.danger, fontSize: fontSizes.sm, marginTop: spacing.xs }}>
              {t('profile.instagramInvalid')}
            </Text>
          ) : null}
        </View>
      </View>

      <SectionHeader title={t('profile.recentActivities')} />
      {actsLoading ? (
        <ActivityIndicator />
      ) : activities.length === 0 ? (
        <EmptyState iconName="footprints" title={t('profile.emptyActivitiesCta')} body={t('profile.emptyActivities')} />
      ) : (
        <View style={{ gap: spacing.md }}>
          {activities.slice(0, 10).map((a) => (
            <ActivityCard
              key={a.id}
              activity={a}
              onPress={onOpenActivity ? () => onOpenActivity(a.id) : undefined}
            />
          ))}
        </View>
      )}

      <Button label={t('profile.signOut')} variant="ghost" onPress={signOut} />
    </Screen>
  );
}
