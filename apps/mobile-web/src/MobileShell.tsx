import React from 'react';
import { useT } from '@minga/i18n';

export type TabKey = 'feed' | 'explore' | 'map' | 'track' | 'profile' | 'settings';

// Renders the @minga/ui screens inside a 428px-wide phone frame on a desktop page.
// Deliberately boring — this surface exists so we can iterate on the RN screens
// from the browser without fighting an Android emulator.
export function MobileShell({
  children,
  activeTab,
  onChangeTab,
  theme,
}: {
  children: React.ReactNode;
  activeTab: TabKey;
  onChangeTab: (tab: TabKey) => void;
  theme: any;
}) {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        background: 'linear-gradient(135deg, #F2E6CE 0%, #ffffff 100%)',
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          width: 428,
          maxWidth: '100%',
          height: 'min(900px, 96vh)',
          borderRadius: 40,
          background: theme.background,
          boxShadow: '0 30px 80px rgba(31, 26, 19, 0.25)',
          border: `8px solid #1F1A13`,
          overflow: 'hidden',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <StatusBar theme={theme} />
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>{children}</div>
        <TabBar theme={theme} activeTab={activeTab} onChangeTab={onChangeTab} />
      </div>
    </div>
  );
}

function StatusBar({ theme }: { theme: any }) {
  const now = new Date();
  const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  return (
    <div
      style={{
        background: theme.background,
        padding: '10px 24px 6px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        color: theme.text,
        fontWeight: 700,
        fontSize: 13,
      }}
    >
      <span>{time}</span>
      <span style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <span>●●●</span>
        <span>📶</span>
        <span>🔋</span>
      </span>
    </div>
  );
}

function TabBar({
  theme,
  activeTab,
  onChangeTab,
}: {
  theme: any;
  activeTab: TabKey;
  onChangeTab: (t: TabKey) => void;
}) {
  const { t } = useT();
  const tabs: { key: TabKey; icon: string; label: string }[] = [
    { key: 'feed', icon: '🏔', label: t('tab.feed') },
    { key: 'explore', icon: '🧭', label: t('tab.explore') },
    { key: 'map', icon: '🗺️', label: t('tab.map') },
    { key: 'track', icon: '⏱', label: t('tab.track') },
    { key: 'profile', icon: '👤', label: t('tab.profile') },
    { key: 'settings', icon: '⚙️', label: t('tab.settings') },
  ];

  return (
    <nav
      style={{
        display: 'flex',
        borderTop: `1px solid ${theme.border}`,
        background: theme.surface,
        padding: '6px 2px 14px',
      }}
    >
      {tabs.map((tab) => {
        const active = activeTab === tab.key;
        return (
          <button
            key={tab.key}
            onClick={() => onChangeTab(tab.key)}
            style={{
              flex: 1,
              background: 'transparent',
              border: 0,
              padding: '6px 0',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
              color: active ? theme.primary : theme.textMuted,
              fontWeight: 700,
              fontSize: 10,
            }}
          >
            <span style={{ fontSize: 20, filter: active ? 'none' : 'grayscale(0.4)' }}>{tab.icon}</span>
            {tab.label}
          </button>
        );
      })}
    </nav>
  );
}
