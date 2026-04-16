import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { ThemeProvider, useTheme } from '@minga/theme';
import type { ExpeditionCategory } from '@minga/types';
import {
  AuthScreen,
  ExpeditionDetailScreen,
  ExploreScreen,
  FeedScreen,
  ProfileScreen,
  SettingsScreen,
  TrackScreen,
} from '@minga/ui';
import './src/supabase';
import { startLocationStream } from './src/locationAdapter';

type Tab = 'feed' | 'explore' | 'track' | 'profile' | 'settings';
type Route = { kind: 'tab'; tab: Tab } | { kind: 'expedition'; id: string };

const TABS: { key: Tab; label: string; icon: string }[] = [
  { key: 'feed', label: 'Feed', icon: '🏔' },
  { key: 'explore', label: 'Explore', icon: '🧭' },
  { key: 'track', label: 'Track', icon: '⏱' },
  { key: 'profile', label: 'Profile', icon: '👤' },
  { key: 'settings', label: 'Settings', icon: '⚙️' },
];

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider persist={{ get: (k) => AsyncStorage.getItem(k), set: (k, v) => AsyncStorage.setItem(k, v) }}>
        <Root />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

function Root() {
  const { theme } = useTheme();
  const [route, setRoute] = useState<Route>({ kind: 'tab', tab: 'feed' });
  const [auth, setAuth] = useState(false);

  const screen = () => {
    if (auth) return <AuthScreen onAuthenticated={() => setAuth(false)} />;
    if (route.kind === 'expedition') {
      return (
        <ExpeditionDetailScreen
          id={route.id}
          onBack={() => setRoute({ kind: 'tab', tab: 'feed' })}
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
      case 'track':
        return <TrackScreen startLocationStream={startLocationStream} />;
      case 'profile':
        return <ProfileScreen onSignIn={() => setAuth(true)} />;
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
        <View
          style={[
            styles.tabBar,
            { backgroundColor: theme.surface, borderTopColor: theme.border },
          ]}
        >
          {TABS.map((t) => {
            const active = route.kind === 'tab' && route.tab === t.key;
            return (
              <Pressable
                key={t.key}
                onPress={() => {
                  setAuth(false);
                  setRoute({ kind: 'tab', tab: t.key });
                }}
                style={styles.tab}
              >
                <Text style={{ fontSize: 22, opacity: active ? 1 : 0.6 }}>{t.icon}</Text>
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: '700',
                    color: active ? theme.primary : theme.textMuted,
                    marginTop: 2,
                  }}
                >
                  {t.label}
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
