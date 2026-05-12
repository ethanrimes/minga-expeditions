import React, { useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as WebBrowser from 'expo-web-browser';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { ThemeProvider, useTheme } from '@minga/theme';
import { LanguageProvider, useT } from '@minga/i18n';
import type { DbExpeditionSalida, ExpeditionCategory, ExpeditionWithAuthor } from '@minga/types';
import { priceCentsForSalida } from '@minga/logic';
import {
  ActivityDetailScreen,
  AuthScreen,
  CalendarScreen,
  CheckoutScreen,
  ExpeditionDetailScreen,
  FeedScreen,
  Icon,
  OrderSuccessScreen,
  ProfileScreen,
  SettingsScreen,
  TrackScreen,
  type IconName,
} from '@minga/ui';
import { supabase } from './src/supabase';
import { locationAdapter } from './src/locationAdapter';
import { MapScreen } from './src/MapScreen';
import { ActivityMap } from './src/ActivityMap';
import { photoPicker } from './src/photoPicker';
import { shareAdapter } from './src/shareAdapter';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';
// Deployed consumer-facing site origin. Used both as the Wompi return target
// (Wompi requires a reachable redirect URL — the in-app OrderSuccessScreen
// polls in parallel, this is just where the browser lands after payment) and
// to build share deep-links for activities.
const PUBLIC_SITE_URL =
  process.env.EXPO_PUBLIC_SITE_URL ?? 'https://minga-expeditions-web.vercel.app';
const FUNCTIONS_BASE_URL = SUPABASE_URL ? `${SUPABASE_URL}/functions/v1` : '';
const SHARE_CARD_BASE_URL = SUPABASE_URL ? `${SUPABASE_URL}/functions/v1/activity-share-card` : '';

// Deep-link target for the OAuth round-trip. Must match the "scheme" in
// app.json AND be in the Supabase project's Authentication → URL
// Configuration → Redirect URLs allowlist or the provider will reject.
const OAUTH_REDIRECT = 'minga://auth/callback';

// Opens Supabase's /authorize URL in an in-app browser session, waits for
// the provider to redirect back to OAUTH_REDIRECT, then exchanges the PKCE
// code for a Supabase session. Returns false if the user dismissed the
// browser before completing sign-in.
async function signInWithOAuth(provider: 'google' | 'facebook'): Promise<boolean> {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: OAUTH_REDIRECT,
      skipBrowserRedirect: true,
    },
  });
  if (error) throw error;
  if (!data?.url) throw new Error('Supabase did not return an OAuth URL');

  const result = await WebBrowser.openAuthSessionAsync(data.url, OAUTH_REDIRECT);
  if (result.type !== 'success' || !result.url) return false;

  const codeMatch = result.url.match(/[?&]code=([^&]+)/);
  if (!codeMatch) throw new Error('OAuth callback did not include a code');
  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(
    decodeURIComponent(codeMatch[1]),
  );
  if (exchangeError) throw exchangeError;
  return true;
}
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

type Tab = 'feed' | 'calendar' | 'map' | 'track' | 'profile' | 'settings';

interface CheckoutContext {
  expedition: ExpeditionWithAuthor;
  salida: DbExpeditionSalida;
}

type Route =
  | { kind: 'tab'; tab: Tab }
  | { kind: 'expedition'; id: string }
  | { kind: 'activity'; id: string }
  | { kind: 'checkout'; ctx: CheckoutContext }
  | { kind: 'order-success'; orderId: string; expeditionId: string };

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
    { key: 'calendar', label: t('tab.calendar'), icon: 'calendar' },
    { key: 'map', label: t('tab.map'), icon: 'map' },
    { key: 'track', label: t('tab.track'), icon: 'activity' },
    { key: 'profile', label: t('tab.profile'), icon: 'user' },
    { key: 'settings', label: t('tab.settings'), icon: 'settings' },
  ];

  const screen = () => {
    if (auth) {
      return (
        <AuthScreen
          onAuthenticated={() => setAuth(false)}
          onOAuthSignIn={signInWithOAuth}
        />
      );
    }
    if (route.kind === 'expedition') {
      return (
        <ExpeditionDetailScreen
          id={route.id}
          onBack={() => setRoute({ kind: 'tab', tab: 'feed' })}
          onSignIn={() => setAuth(true)}
          onBookSalida={(salida, expedition) => {
            setRoute({ kind: 'checkout', ctx: { expedition, salida } });
          }}
        />
      );
    }
    if (route.kind === 'checkout') {
      const { expedition, salida } = route.ctx;
      const { price_cents, currency } = priceCentsForSalida(salida, expedition);
      return (
        <CheckoutScreen
          expeditionId={expedition.id}
          expeditionTitle={expedition.title}
          priceCents={price_cents}
          currency={currency}
          salidaId={salida.id}
          salidaStartsAt={salida.starts_at}
          salidaTimezone={salida.timezone}
          functionsBaseUrl={FUNCTIONS_BASE_URL}
          returnOrigin={PUBLIC_SITE_URL}
          openCheckoutUrl={(url) => Linking.openURL(url)}
          onClose={() => setRoute({ kind: 'expedition', id: expedition.id })}
          onOrderCreated={(orderId) => {
            // Switch to the in-app success screen right away so it's already
            // polling when the user returns from the external Wompi tab.
            setRoute({ kind: 'order-success', orderId, expeditionId: expedition.id });
          }}
        />
      );
    }
    if (route.kind === 'order-success') {
      return (
        <OrderSuccessScreen
          orderId={route.orderId}
          functionsBaseUrl={FUNCTIONS_BASE_URL}
          supabaseAnonKey={SUPABASE_ANON_KEY}
          onBack={() => setRoute({ kind: 'tab', tab: 'feed' })}
          onSignUp={() => setAuth(true)}
          onOpenExpedition={(eid) => setRoute({ kind: 'expedition', id: eid })}
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
          onSignIn={() => setAuth(true)}
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
        return (
          <TrackScreen
            locationAdapter={locationAdapter}
            onSignIn={() => setAuth(true)}
          />
        );
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
