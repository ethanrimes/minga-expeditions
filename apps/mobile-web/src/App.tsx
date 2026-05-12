import React, { useEffect, useState } from 'react';
import { useTheme } from '@minga/theme';
import type { DbExpeditionSalida, ExpeditionCategory, ExpeditionWithAuthor } from '@minga/types';
import { priceCentsForSalida } from '@minga/logic';
import {
  ActivityDetailScreen,
  AuthScreen,
  CalendarScreen,
  CheckoutScreen,
  ExpeditionDetailScreen,
  FeedScreen,
  OrderSuccessScreen,
  ProfileScreen,
  SettingsScreen,
  TrackScreen,
} from '@minga/ui';
import { supabase } from './supabase';
import { locationAdapter } from './locationAdapter';
import { MobileShell, type TabKey } from './MobileShell';
import { MapScreen } from './MapScreen';
import { ActivityMap } from './ActivityMap';
import { photoPicker } from './photoPicker';
import { shareAdapter } from './shareAdapter';

// Same-tab redirect to the Supabase /authorize endpoint, which bounces back
// to our origin with ?code=... The Supabase client's detectSessionInUrl
// handles the exchange automatically on page load.
async function signInWithOAuth(provider: 'google' | 'facebook'): Promise<boolean> {
  const { error } = await supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo: window.location.origin },
  });
  if (error) throw error;
  return true;
}

const env = import.meta.env as unknown as Record<string, string>;
const SUPABASE_URL = env.VITE_SUPABASE_URL ?? '';
const SUPABASE_ANON_KEY = env.VITE_SUPABASE_ANON_KEY ?? '';
// Deployed consumer-facing origin. Used both as Wompi's return target after
// payment and as the prefix for activity share deep-links.
const PUBLIC_SITE_URL =
  env.VITE_PUBLIC_SITE_URL ?? 'https://minga-expeditions-mobile-web.vercel.app';
const FUNCTIONS_BASE_URL = SUPABASE_URL ? `${SUPABASE_URL}/functions/v1` : '';
const SHARE_CARD_BASE_URL = SUPABASE_URL ? `${SUPABASE_URL}/functions/v1/activity-share-card` : '';
const WHATSAPP_ENABLED = env.VITE_WHATSAPP_ENABLED === 'true';

interface CheckoutContext {
  expedition: ExpeditionWithAuthor;
  salida: DbExpeditionSalida;
}

type Route =
  | { kind: 'tab'; tab: TabKey }
  | { kind: 'expedition'; id: string }
  | { kind: 'activity'; id: string }
  | { kind: 'checkout'; ctx: CheckoutContext }
  | { kind: 'order-success'; orderId: string; expeditionId: string };

function initialRoute(): Route {
  // After Wompi sends the user back to /orders/<id>/success we land here with
  // a fresh React state. Parse the path so we drop straight into the polling
  // success screen instead of the feed tab.
  if (typeof window === 'undefined') return { kind: 'tab', tab: 'feed' };
  const m = window.location.pathname.match(/^\/orders\/([^/]+)\/success\/?$/);
  if (m) return { kind: 'order-success', orderId: m[1], expeditionId: '' };
  return { kind: 'tab', tab: 'feed' };
}

export function App() {
  const { theme } = useTheme();
  const [route, setRoute] = useState<Route>(() => initialRoute());
  const [feedCategory, setFeedCategory] = useState<ExpeditionCategory | 'all'>('all');
  const [authVisible, setAuthVisible] = useState(false);

  // Once we render the order-success route, drop the /orders/.../success path
  // back to "/" so a tab switch leaves a clean URL behind.
  useEffect(() => {
    if (route.kind === 'order-success' && typeof window !== 'undefined') {
      window.history.replaceState(null, '', '/');
    }
  }, [route.kind]);

  const goBackToProfile = () => setRoute({ kind: 'tab', tab: 'profile' });

  const renderScreen = () => {
    if (authVisible) {
      return (
        <AuthScreen
          onAuthenticated={() => setAuthVisible(false)}
          onOAuthSignIn={signInWithOAuth}
        />
      );
    }
    if (route.kind === 'expedition') {
      return (
        <ExpeditionDetailScreen
          id={route.id}
          onBack={() => setRoute({ kind: 'tab', tab: 'feed' })}
          onSignIn={() => setAuthVisible(true)}
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
          whatsappEnabled={WHATSAPP_ENABLED}
          returnOrigin={PUBLIC_SITE_URL}
          openCheckoutUrl={(url) => {
            // Same-tab redirect so the Wompi return URL brings the user back
            // to this mobile-web app's order-success route after payment.
            window.location.assign(url);
          }}
          onClose={() => setRoute({ kind: 'expedition', id: expedition.id })}
          onOrderCreated={(orderId) => {
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
          onSignUp={() => setAuthVisible(true)}
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
          onBack={goBackToProfile}
          onSignIn={() => setAuthVisible(true)}
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
            variant="grid"
            onOpenExpedition={(id) => setRoute({ kind: 'expedition', id })}
          />
        );
      case 'map':
        return <MapScreen onOpenExpedition={(id) => setRoute({ kind: 'expedition', id })} />;
      case 'track':
        return (
          <TrackScreen
            locationAdapter={locationAdapter}
            onSignIn={() => setAuthVisible(true)}
          />
        );
      case 'profile':
        return (
          <ProfileScreen
            onSignIn={() => setAuthVisible(true)}
            onOpenActivity={(id) => setRoute({ kind: 'activity', id })}
            photoPicker={photoPicker}
          />
        );
      case 'settings':
        return <SettingsScreen />;
    }
  };

  return (
    <MobileShell
      activeTab={route.kind === 'tab' ? route.tab : route.kind === 'activity' ? 'profile' : 'feed'}
      onChangeTab={(t) => {
        setAuthVisible(false);
        if (t === 'feed' && (route.kind !== 'tab' || route.tab !== 'feed')) setFeedCategory('all');
        setRoute({ kind: 'tab', tab: t });
      }}
      theme={theme}
    >
      {renderScreen()}
    </MobileShell>
  );
}
