import React, { useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { ThemeProvider, useTheme } from '@minga/theme';
import { LanguageProvider, useT } from '@minga/i18n';
import type { ExpeditionCategory } from '@minga/types';
import {
  ActivityDetailScreen,
  AuthScreen,
  CalendarScreen,
  ExpeditionDetailScreen,
  ExploreScreen,
  FeedScreen,
  Icon,
  ProfileScreen,
  SettingsScreen,
  TrackScreen,
  type IconName,
} from '@minga/ui';
import './src/supabase';
import { startLocationStream } from './src/locationAdapter';
import { MapScreen } from './src/MapScreen';
import { ActivityMap } from './src/ActivityMap';
import { photoPicker } from './src/photoPicker';
import { shareAdapter } from './src/shareAdapter';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const PUBLIC_SITE_URL = process.env.EXPO_PUBLIC_SITE_URL ?? 'https://minga.co';
const SHARE_CARD_BASE_URL = SUPABASE_URL ? `${SUPABASE_URL}/functions/v1/activity-share-card` : '';
import * as Sentry from '@sentry/react-native';

Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN ?? '',

  // Adds more context data to events (IP address, cookies, user, etc.)
  // For more information, visit: https://docs.sentry.io/platforms/react-native/data-management/data-collected/
  sendDefaultPii: true,

  // Enable Logs
  enableLogs: true,

  // Configure Session Replay
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1,
  integrations: [Sentry.mobileReplayIntegration(), Sentry.feedbackIntegration()],

  // uncomment the line below to enable Spotlight (https://spotlightjs.com)
  // spotlight: __DEV__,
});

type Tab = 'feed' | 'explore' | 'calendar' | 'map' | 'track' | 'profile' | 'settings';
type Route =
  | { kind: 'tab'; tab: Tab }
  | { kind: 'expedition'; id: string }
  | { kind: 'activity'; id: string };

const asyncStoragePersist = {
  get: (k: string) => AsyncStorage.getItem(k),
  set: (k: string, v: string) => AsyncStorage.setItem(k, v),
};

export default Sentry.wrap(function App() {
  return (
    <SafeAreaProvider>
      <LanguageProvider persist={asyncStoragePersist}>
        <ThemeProvider persist={asyncStoragePersist}>
          <Root />
        </ThemeProvider>
      </LanguageProvider>
    </SafeAreaProvider>
  );
});

function Root() {
  const { theme } = useTheme();
  const { t } = useT();
  const [route, setRoute] = useState<Route>({ kind: 'tab', tab: 'feed' });
  const [feedCategory, setFeedCategory] = useState<ExpeditionCategory | 'all'>('all');
  const [auth, setAuth] = useState(false);

  const tabs: { key: Tab; label: string; icon: IconName }[] = [
    { key: 'feed', label: t('tab.feed'), icon: 'mountain' },
    { key: 'explore', label: t('tab.explore'), icon: 'compass' },
    { key: 'calendar', label: t('tab.calendar'), icon: 'calendar' },
    { key: 'map', label: t('tab.map'), icon: 'map' },
    { key: 'track', label: t('tab.track'), icon: 'activity' },
    { key: 'profile', label: t('tab.profile'), icon: 'user' },
    { key: 'settings', label: t('tab.settings'), icon: 'settings' },
  ];

  const screen = () => {
    if (auth) return <AuthScreen onAuthenticated={() => setAuth(false)} />;
    if (route.kind === 'expedition') {
      return (
        <ExpeditionDetailScreen
          id={route.id}
          onBack={() => setRoute({ kind: 'tab', tab: 'feed' })}
          onBookSalida={(salida) => {
            // Native app hands off to the web checkout — the Wompi widget
            // can't render inside the RN runtime, and opening the same URL
            // keeps a single payment integration to maintain.
            const target = `${PUBLIC_SITE_URL}/expeditions/${route.id}?salida=${salida.id}`;
            void Linking.openURL(target);
          }}
        />
      );
    }
    if (route.kind === 'activity') {
      return (
        <ActivityDetailScreen
          id={route.id}
          MapComponent={ActivityMap}
          photoPicker={photoPicker}
          shareAdapter={shareAdapter}
          shareCardBaseUrl={SHARE_CARD_BASE_URL}
          publicSiteUrl={PUBLIC_SITE_URL}
          onBack={() => setRoute({ kind: 'tab', tab: 'profile' })}
          onOpenExpedition={(eid) => setRoute({ kind: 'expedition', id: eid })}
        />
      );
    }
    switch (route.tab) {
      case 'feed':
        return (
          <FeedScreen
            key={`feed-${feedCategory}`}
            initialCategory={feedCategory}
            onOpenExpedition={(id) => setRoute({ kind: 'expedition', id })}
          />
        );
      case 'explore':
        return (
          <ExploreScreen
            onPickCategory={(c: ExpeditionCategory) => {
              setFeedCategory(c);
              setRoute({ kind: 'tab', tab: 'feed' });
            }}
          />
        );
      case 'calendar':
        return (
          <CalendarScreen
            variant="agenda"
            onOpenExpedition={(id) => setRoute({ kind: 'expedition', id })}
          />
        );
      case 'map':
        return <MapScreen onOpenExpedition={(id) => setRoute({ kind: 'expedition', id })} />;
      case 'track':
        return <TrackScreen startLocationStream={startLocationStream} />;
      case 'profile':
        return (
          <ProfileScreen
            onSignIn={() => setAuth(true)}
            onOpenActivity={(id) => setRoute({ kind: 'activity', id })}
            photoPicker={photoPicker}
          />
        );
      case 'settings':
        return <SettingsScreen />;
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <StatusBar style={theme.mode === 'dark' ? 'light' : 'dark'} />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <View style={{ flex: 1 }}>{screen()}</View>
      </SafeAreaView>
      <SafeAreaView edges={['bottom']} style={{ backgroundColor: theme.surface }}>
        <View style={[styles.tabBar, { backgroundColor: theme.surface, borderTopColor: theme.border }]}>
          {tabs.map((tab) => {
            const active = route.kind === 'tab' && route.tab === tab.key;
            return (
              <Pressable
                key={tab.key}
                onPress={() => {
                  setAuth(false);
                  if (tab.key === 'feed' && (route.kind !== 'tab' || route.tab !== 'feed')) {
                    setFeedCategory('all');
                  }
                  setRoute({ kind: 'tab', tab: tab.key });
                }}
                style={styles.tab}
              >
                <Icon
                  name={tab.icon}
                  size={22}
                  color={active ? theme.primary : theme.textMuted}
                  strokeWidth={active ? 2.4 : 2}
                />
                <Text
                  style={{
                    fontSize: 10,
                    fontWeight: '700',
                    color: active ? theme.primary : theme.textMuted,
                    marginTop: 2,
                  }}
                >
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingTop: 4,
    paddingBottom: 4,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 6,
  },
});
