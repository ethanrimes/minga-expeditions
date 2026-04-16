import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { useTheme, spacing, fontSizes, fontWeights, radii } from '@minga/theme';
import { fetchProfile, getSupabase } from '@minga/supabase';
import { formatDistanceKm, formatElevation } from '@minga/logic';
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

export function ProfileScreen({ onSignIn }: { onSignIn?: () => void }) {
  const { theme } = useTheme();
  const { user, signOut, loading: authLoading } = useAuth();
  const { activities, loading: actsLoading } = useMyActivities();
  const [profile, setProfile] = useState<DbProfile | null>(null);

  useEffect(() => {
    if (!user) return;
    fetchProfile(getSupabase(), user.id).then(setProfile);
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
        <EmptyState icon="👤" title="Sign in to see your profile" body="Track expeditions, earn tiers, and follow friends." />
        <Button label="Sign in" onPress={onSignIn} />
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
        <StatBlock label="Total km" value={formatDistanceKm(profile?.total_distance_km ?? 0)} />
        <StatBlock label="Elevation" value={formatElevation(profile?.total_elevation_m ?? 0)} />
        <StatBlock label="Activities" value={String(activities.length)} />
      </View>

      {profile ? <TierProgress distanceKm={profile.total_distance_km} /> : null}

      <SectionHeader title="Recent activities" />
      {actsLoading ? (
        <ActivityIndicator />
      ) : activities.length === 0 ? (
        <EmptyState icon="🥾" title="No activities yet" body="Start a tracking session to rack up km." />
      ) : (
        <View style={{ gap: spacing.md }}>
          {activities.slice(0, 10).map((a) => (
            <ActivityCard key={a.id} activity={a} />
          ))}
        </View>
      )}

      <Button label="Sign out" variant="ghost" onPress={signOut} />
    </Screen>
  );
}
