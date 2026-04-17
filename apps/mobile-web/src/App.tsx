import React, { useState } from 'react';
import { useTheme } from '@minga/theme';
import type { ExpeditionCategory } from '@minga/types';
import {
  ActivityDetailScreen,
  AuthScreen,
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

type Route =
  | { kind: 'tab'; tab: TabKey }
  | { kind: 'expedition'; id: string }
  | { kind: 'activity'; id: string };

export function App() {
  const { theme } = useTheme();
  const [route, setRoute] = useState<Route>({ kind: 'tab', tab: 'feed' });
  const [authVisible, setAuthVisible] = useState(false);

  const goBackToProfile = () => setRoute({ kind: 'tab', tab: 'profile' });

  const renderScreen = () => {
    if (authVisible) return <AuthScreen onAuthenticated={() => setAuthVisible(false)} />;
    if (route.kind === 'expedition') {
      return <ExpeditionDetailScreen id={route.id} onBack={() => setRoute({ kind: 'tab', tab: 'feed' })} />;
    }
    if (route.kind === 'activity') {
      return (
        <ActivityDetailScreen
          id={route.id}
          MapComponent={ActivityMap}
          onBack={goBackToProfile}
          onOpenExpedition={(eid) => setRoute({ kind: 'expedition', id: eid })}
        />
      );
    }
    switch (route.tab) {
      case 'feed':
        return <FeedScreen onOpenExpedition={(id) => setRoute({ kind: 'expedition', id })} />;
      case 'explore':
        return (
          <ExploreScreen onPickCategory={(_cat: ExpeditionCategory) => setRoute({ kind: 'tab', tab: 'feed' })} />
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
        setRoute({ kind: 'tab', tab: t });
      }}
      theme={theme}
    >
      {renderScreen()}
    </MobileShell>
  );
}
