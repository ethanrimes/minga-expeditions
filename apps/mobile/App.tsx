import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { ThemeProvider, useTheme } from '@minga/theme';
import { LanguageProvider, useT } from '@minga/i18n';
import type { ExpeditionCategory } from '@minga/types';
import {
  ActivityDetailScreen,
  AuthScreen,
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
import * as Sentry from '@sentry/react-native';

Sentry.init({
  dsn: 'https://b2238c466b4d6f64f9ee3625d97b116f@o4511277462388736.ingest.us.sentry.io/4511277463699456',

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

type Tab = 'feed' | 'explore' | 'map' | 'track' | 'profile' | 'settings';
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
  const [auth, setAuth] = useState(false);

  const tabs: { key: Tab; label: string; icon: IconName }[] = [
    { key: 'feed', label: t('tab.feed'), icon: 'mountain' },
    { key: 'explore', label: t('tab.explore'), icon: 'compass' },
    { key: 'map', label: t('tab.map'), icon: 'map' },
    { key: 'track', label: t('tab.track'), icon: 'activity' },
    { key: 'profile', label: t('tab.profile'), icon: 'user' },
    { key: 'settings', label: t('tab.settings'), icon: 'settings' },
  ];

  const screen = () => {
    if (auth) return <AuthScreen onAuthenticated={() => setAuth(false)} />;
    if (route.kind === 'expedition') {
      return <ExpeditionDetailScreen id={route.id} onBack={() => setRoute({ kind: 'tab', tab: 'feed' })} />;
    }
    if (route.kind === 'activity') {
      return (
        <ActivityDetailScreen
          id={route.id}
          MapComponent={ActivityMap}
          onBack={() => setRoute({ kind: 'tab', tab: 'profile' })}
          onOpenExpedition={(eid) => setRoute({ kind: 'expedition', id: eid })}
        />
      );
    }
    switch (route.tab) {
      case 'feed':
        return <FeedScreen onOpenExpedition={(id) => setRoute({ kind: 'expedition', id })} />;
      case 'explore':
        return (
          <ExploreScreen onPickCategory={(_c: ExpeditionCategory) => setRoute({ kind: 'tab', tab: 'feed' })} />
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
