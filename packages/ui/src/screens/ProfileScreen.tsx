import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, Text, TextInput, View } from 'react-native';
import { useTheme, spacing, fontSizes, fontWeights, radii } from '@minga/theme';
import { fetchProfile, getSupabase, updateMyProfile, uploadAvatar } from '@minga/supabase';
import { formatDistanceKm, formatElevation, DEFAULT_COUNTRY_CODE } from '@minga/logic';
import { useT } from '@minga/i18n';
import type { DbProfile } from '@minga/types';
import { Screen } from '../primitives/Screen';
import { Avatar } from '../primitives/Avatar';
import { Button } from '../primitives/Button';
import { TierBadge } from '../primitives/TierBadge';
import { StatBlock } from '../primitives/StatBlock';
import { CountryCodeCombobox } from '../primitives/CountryCodeCombobox';
import { GoogleGlyph } from '../primitives/BrandIcons';
import { ActivityCard } from '../components/ActivityCard';
import { SectionHeader } from '../components/SectionHeader';
import { EmptyState } from '../components/EmptyState';
import { TierProgress } from '../components/TierProgress';
import { SocialRow, type SocialBrand } from '../components/SocialRow';
import { useAuth } from '../hooks/useAuth';
import { useMyActivities } from '../hooks/useMyActivities';
import type { ActivityPhotoPicker } from './ActivityDetailScreen';

// Brand presets for the social rows — same shape used on web so the icon
// colours are identical across platforms.
const BRANDS: Record<'email' | 'google' | 'whatsapp' | 'facebook' | 'instagram', SocialBrand> = {
  email: { iconName: 'mail', iconBg: '#E5E7EB', iconColor: '#374151' },
  google: {
    iconNode: <GoogleGlyph size={18} color="#4285F4" strokeWidth={2.2} />,
    iconBg: '#FFFFFF',
    iconColor: '#4285F4',
  },
  whatsapp: { iconName: 'message', iconBg: '#25D366', iconColor: '#FFFFFF' },
  facebook: { iconName: 'facebook', iconBg: '#1877F2', iconColor: '#FFFFFF' },
  instagram: { iconName: 'instagram', iconBg: '#E4405F', iconColor: '#FFFFFF' },
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
  const [phoneCode, setPhoneCode] = useState<string>(DEFAULT_COUNTRY_CODE);
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [phoneSaveState, setPhoneSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [displayName, setDisplayName] = useState<string>('');
  const [nameSaveState, setNameSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [instagramHandle, setInstagramHandle] = useState<string>('');
  const [igSaveState, setIgSaveState] = useState<'idle' | 'saving' | 'saved' | 'error' | 'invalid'>('idle');
  const [avatarState, setAvatarState] = useState<'idle' | 'uploading' | 'error'>('idle');
  const [savedInstagram, setSavedInstagram] = useState<string | null>(null);
  const [savedPhone, setSavedPhone] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    fetchProfile(getSupabase(), user.id).then((p) => {
      setProfile(p);
      if (p?.display_name) setDisplayName(p.display_name);
    });
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
        if (p?.phone_country_code && p?.phone_number) {
          setSavedPhone(`${p.phone_country_code}${p.phone_number}`);
        }
        if (p?.instagram_handle) {
          setInstagramHandle(p.instagram_handle);
          setSavedInstagram(p.instagram_handle);
        }
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
    setSavedPhone(trimmed ? `${phoneCode}${trimmed}` : null);
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
      setSavedInstagram(normalized || null);
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

  // Identity providers — supabase populates `user.identities` per linked
  // OAuth account; the first entry is the original signup method, which we
  // surface as the "primary" sign-in (rendered as a star, no copy).
  const identities = (user?.identities ?? []) as Array<{ provider: string }>;
  const providers = identities.length
    ? identities.map((i) => i.provider)
    : ((user?.app_metadata?.providers as string[] | undefined) ?? []);
  const primaryProvider = providers[0] ?? 'email';
  const providerSet = new Set(providers);

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

  const trimmedPhone = phoneNumber.replace(/\D/g, '');
  const phoneE164 = trimmedPhone ? `${phoneCode}${trimmedPhone}` : null;
  const phoneLinked = !!savedPhone;
  const instagramLinked = !!savedInstagram;

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
          gap: spacing.lg,
        }}
      >
        <SocialRow
          brand={BRANDS.email}
          label={t('profile.emailLabel')}
          value={user.email ?? null}
          linked={!!user.email}
          primary={primaryProvider === 'email'}
          notLinkedLabel={t('profile.notLinked')}
          primaryAriaLabel={t('profile.primaryLogin')}
        />

        <Divider />

        <SocialRow
          brand={BRANDS.google}
          label={t('profile.googleLabel')}
          value={providerSet.has('google') ? t('profile.linked') : null}
          linked={providerSet.has('google')}
          primary={primaryProvider === 'google'}
          notLinkedLabel={t('profile.notLinked')}
          primaryAriaLabel={t('profile.primaryLogin')}
        />

        <Divider />

        <SocialRow
          brand={BRANDS.whatsapp}
          label={t('profile.whatsappLabel')}
          value={savedPhone}
          linked={phoneLinked}
          notLinkedLabel={t('profile.notLinked')}
        >
          <View style={{ gap: spacing.sm }}>
            <Text style={{ color: theme.textMuted, fontSize: fontSizes.sm }}>
              {t('profile.whatsappHelp')}
            </Text>
            <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' }}>
              <CountryCodeCombobox value={phoneCode} onChange={(c) => setPhoneCode(c)} />
              <View style={{ flex: 1 }}>
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
                    fontSize: fontSizes.md,
                  }}
                />
              </View>
            </View>
            <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'center' }}>
              <Pressable
                onPress={() => void savePhone()}
                disabled={phoneSaveState === 'saving' || phoneE164 === savedPhone}
                style={{
                  alignSelf: 'flex-start',
                  backgroundColor: phoneSaveState === 'saved' ? theme.surfaceAlt : theme.primary,
                  borderColor: phoneSaveState === 'saved' ? theme.border : 'transparent',
                  borderWidth: phoneSaveState === 'saved' ? 1 : 0,
                  paddingHorizontal: spacing.lg,
                  paddingVertical: spacing.sm,
                  borderRadius: radii.pill,
                  opacity: phoneSaveState === 'saving' || phoneE164 === savedPhone ? 0.6 : 1,
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
          </View>
        </SocialRow>

        <Divider />

        <SocialRow
          brand={BRANDS.facebook}
          label={t('profile.facebookLabel')}
          value={providerSet.has('facebook') ? t('profile.linked') : null}
          linked={providerSet.has('facebook')}
          primary={primaryProvider === 'facebook'}
          notLinkedLabel={t('profile.notLinked')}
          primaryAriaLabel={t('profile.primaryLogin')}
        />

        <Divider />

        <SocialRow
          brand={BRANDS.instagram}
          label={t('profile.instagramLabel')}
          value={savedInstagram ? `@${savedInstagram}` : null}
          linked={instagramLinked}
          notLinkedLabel={t('profile.notLinked')}
        >
          <View style={{ gap: spacing.sm }}>
            <Text style={{ color: theme.textMuted, fontSize: fontSizes.sm }}>
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
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
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
              {savedInstagram && savedInstagram === instagramHandle ? (
                <Pressable
                  onPress={() => void Linking.openURL(`https://instagram.com/${savedInstagram}`)}
                  style={{ paddingHorizontal: spacing.sm, paddingVertical: spacing.xs }}
                >
                  <Text style={{ color: theme.primary, fontWeight: fontWeights.bold, fontSize: fontSizes.sm }}>
                    {t('profile.instagramOpen')}
                  </Text>
                </Pressable>
              ) : null}
            </View>
            {igSaveState === 'invalid' ? (
              <Text style={{ color: theme.danger, fontSize: fontSizes.sm }}>
                {t('profile.instagramInvalid')}
              </Text>
            ) : null}
          </View>
        </SocialRow>
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

function Divider() {
  const { theme } = useTheme();
  return <View style={{ height: 1, backgroundColor: theme.border, opacity: 0.6 }} />;
}
