import React, { useState } from 'react';
import { useTheme } from '@minga/theme';
import type { ExpeditionCategory } from '@minga/types';
import {
  ActivityDetailScreen,
  AuthScreen,
  CalendarScreen,
  ExpeditionDetailScreen,
  ExploreScreen,
  FeedScreen,
  ProfileScreen,
  SettingsScreen,
  TrackScreen,
} from '@minga/ui';
import { startLocationStream } from './locationAdapter';
import { MobileShell, type TabKey } from './MobileShell';
import { MapScreen } from './MapScreen';
import { ActivityMap } from './ActivityMap';
import { photoPicker } from './photoPicker';
import { shareAdapter } from './shareAdapter';

const env = import.meta.env as unknown as Record<string, string>;
const SUPABASE_URL = env.VITE_SUPABASE_URL ?? '';
const PUBLIC_SITE_URL = env.VITE_PUBLIC_SITE_URL ?? 'https://minga.co';
const SHARE_CARD_BASE_URL = SUPABASE_URL ? `${SUPABASE_URL}/functions/v1/activity-share-card` : '';

type Route =
  | { kind: 'tab'; tab: TabKey }
  | { kind: 'expedition'; id: string }
  | { kind: 'activity'; id: string };

export function App() {
  const { theme } = useTheme();
  const [route, setRoute] = useState<Route>({ kind: 'tab', tab: 'feed' });
  const [feedCategory, setFeedCategory] = useState<ExpeditionCategory | 'all'>('all');
  const [authVisible, setAuthVisible] = useState(false);

  const goBackToProfile = () => setRoute({ kind: 'tab', tab: 'profile' });

  const renderScreen = () => {
    if (authVisible) return <AuthScreen onAuthenticated={() => setAuthVisible(false)} />;
    if (route.kind === 'expedition') {
      return (
        <ExpeditionDetailScreen
          id={route.id}
          onBack={() => setRoute({ kind: 'tab', tab: 'feed' })}
          onBookSalida={(salida) => {
            // mobile-web defers to the public web checkout so we don't
            // duplicate the Wompi widget integration in two places.
            const target = `${PUBLIC_SITE_URL}/expeditions/${route.id}?salida=${salida.id}`;
            window.open(target, '_blank', 'noopener');
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
          onBack={goBackToProfile}
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
            onPickCategory={(cat: ExpeditionCategory) => {
              setFeedCategory(cat);
              setRoute({ kind: 'tab', tab: 'feed' });
            }}
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
        return <TrackScreen startLocationStream={startLocationStream} />;
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
