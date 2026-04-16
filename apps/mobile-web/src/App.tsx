import React, { useState } from 'react';
import { useTheme } from '@minga/theme';
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
import { startLocationStream } from './locationAdapter';
import { MobileShell, type TabKey } from './MobileShell';

type Route =
  | { kind: 'tab'; tab: TabKey }
  | { kind: 'expedition'; id: string };

export function App() {
  const { theme } = useTheme();
  const [route, setRoute] = useState<Route>({ kind: 'tab', tab: 'feed' });
  const [authVisible, setAuthVisible] = useState(false);

  // Route-to-screen dispatch keeps the shell dumb and the stack single-frame.
  const renderScreen = () => {
    if (authVisible) return <AuthScreen onAuthenticated={() => setAuthVisible(false)} />;
    if (route.kind === 'expedition') {
      return (
        <ExpeditionDetailScreen id={route.id} onBack={() => setRoute({ kind: 'tab', tab: 'feed' })} />
      );
    }
    switch (route.tab) {
      case 'feed':
        return (
          <FeedScreen onOpenExpedition={(id) => setRoute({ kind: 'expedition', id })} />
        );
      case 'explore':
        return (
          <ExploreScreen
            onPickCategory={(_cat: ExpeditionCategory) => setRoute({ kind: 'tab', tab: 'feed' })}
          />
        );
      case 'track':
        return <TrackScreen startLocationStream={startLocationStream} />;
      case 'profile':
        return <ProfileScreen onSignIn={() => setAuthVisible(true)} />;
      case 'settings':
        return <SettingsScreen />;
    }
  };

  return (
    <MobileShell
      activeTab={route.kind === 'tab' ? route.tab : 'feed'}
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
