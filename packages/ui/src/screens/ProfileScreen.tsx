import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { useTheme, spacing, fontSizes, fontWeights, radii } from '@minga/theme';
import { fetchProfile, getSupabase } from '@minga/supabase';
import { summarizeActivities } from '@minga/logic';
import { useT } from '@minga/i18n';
import type { DbProfile } from '@minga/types';
import { Screen } from '../primitives/Screen';
import { Avatar } from '../primitives/Avatar';
import { Button } from '../primitives/Button';
import { TierBadge } from '../primitives/TierBadge';
import { Icon } from '../primitives/Icon';
import { ActivityCard } from '../components/ActivityCard';
import { SectionHeader } from '../components/SectionHeader';
import { EmptyState } from '../components/EmptyState';
import { TierProgress } from '../components/TierProgress';
import { MetricsBreakdown } from '../components/MetricsBreakdown';
import { ActivityCalendar } from '../components/ActivityCalendar';
import { useAuth } from '../hooks/useAuth';
import { useMyActivities } from '../hooks/useMyActivities';

export function ProfileScreen({
  onSignIn,
  onOpenActivity,
  onOpenSettings,
}: {
  onSignIn?: () => void;
  onOpenActivity?: (activityId: string) => void;
  onOpenSettings?: () => void;
}) {
  const { theme } = useTheme();
  const { t } = useT();
  const { user, loading: authLoading } = useAuth();
  const { activities, loading: actsLoading } = useMyActivities();
  const [profile, setProfile] = useState<DbProfile | null>(null);

  useEffect(() => {
    if (!user) return;
    void fetchProfile(getSupabase(), user.id).then(setProfile);
  }, [user?.id]);

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

  const summary = summarizeActivities(activities);

  return (
    <Screen>
      {/* Header — avatar, name, tier, gear → settings */}
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
        <Pressable
          onPress={onOpenSettings}
          accessibilityLabel={t('profile.openSettings')}
          hitSlop={8}
          style={{
            width: 44,
            height: 44,
            borderRadius: radii.pill,
            backgroundColor: theme.surfaceAlt,
            borderColor: theme.border,
            borderWidth: 1,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon name="settings" size={20} color={theme.text} strokeWidth={2} />
        </Pressable>
      </View>

      {profile?.bio ? <Text style={{ color: theme.text }}>{profile.bio}</Text> : null}

      {/* Metrics breakdown — everything / with Minga / on your own */}
      <SectionHeader title={t('profile.metricsHeading')} />
      <MetricsBreakdown summary={summary} />

      {profile ? <TierProgress distanceKm={profile.total_distance_km} /> : null}

      {/* Activity calendar */}
      <ActivityCalendar activities={activities} />

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
    </Screen>
  );
}
