import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';
import { useTheme, spacing, fontSizes, fontWeights, radii } from '@minga/theme';
import { fetchProfile, getSupabase } from '@minga/supabase';
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

// Keep this list in sync with apps/web/src/components/CheckoutDrawer.tsx +
// apps/web/src/pages/ProfilePage.tsx so the country-code picker is
// consistent across surfaces. Colombia first (launch market).
const COUNTRY_CODES = ['+57', '+1', '+52', '+593', '+51', '+56', '+54', '+55', '+58', '+591', '+34', '+44'];

const PROVIDER_LABELS: Record<string, string> = {
  email: 'Email + password',
  facebook: 'Facebook',
  google: 'Google',
  apple: 'Apple',
  github: 'GitHub',
  anonymous: 'Guest session',
};

export function ProfileScreen({
  onSignIn,
  onOpenActivity,
}: {
  onSignIn?: () => void;
  onOpenActivity?: (activityId: string) => void;
}) {
  const { theme } = useTheme();
  const { t } = useT();
  const { user, signOut, loading: authLoading } = useAuth();
  const { activities, loading: actsLoading } = useMyActivities();
  const [profile, setProfile] = useState<DbProfile | null>(null);
  const [phoneCode, setPhoneCode] = useState<string>('+57');
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [phoneSaveState, setPhoneSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  useEffect(() => {
    if (!user) return;
    fetchProfile(getSupabase(), user.id).then(setProfile);
    // Fetch phone fields directly — fetchProfile returns the typed DbProfile
    // shape which doesn't include phone yet, so we read once here.
    void getSupabase()
      .from('profiles')
      .select('phone_country_code, phone_number')
      .eq('id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        const p = data as { phone_country_code: string | null; phone_number: string | null } | null;
        if (p?.phone_country_code) setPhoneCode(p.phone_country_code);
        if (p?.phone_number) setPhoneNumber(p.phone_number);
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
        <Avatar uri={profile?.avatar_url} name={profile?.display_name ?? user.email} size={72} />
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

      <SectionHeader title="Connected accounts" />
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
          <Text style={{ color: theme.text, fontWeight: fontWeights.bold }}>Email</Text>
          <Text style={{ color: theme.text }}>{user.email ?? '—'}</Text>
        </View>
        <View>
          <Text style={{ color: theme.text, fontWeight: fontWeights.bold }}>Sign-in method</Text>
          <Text style={{ color: theme.text }}>
            {identityProviders.length
              ? identityProviders.map((p) => PROVIDER_LABELS[p] ?? p).join(' · ')
              : 'Email + password'}
          </Text>
        </View>
        <View>
          <Text style={{ color: theme.text, fontWeight: fontWeights.bold, marginBottom: spacing.xs }}>WhatsApp</Text>
          <Text style={{ color: theme.textMuted, fontSize: fontSizes.sm, marginBottom: spacing.sm }}>
            Used to send booking confirmations and trip reminders.
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
                ? 'Saving…'
                : phoneSaveState === 'saved'
                ? 'Saved ✓'
                : phoneSaveState === 'error'
                ? 'Retry'
                : 'Save'}
            </Text>
          </Pressable>
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
