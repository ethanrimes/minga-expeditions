import React from 'react';

export type TabKey = 'feed' | 'explore' | 'track' | 'profile' | 'settings';

const TABS: { key: TabKey; label: string; icon: string }[] = [
  { key: 'feed', label: 'Feed', icon: '🏔' },
  { key: 'explore', label: 'Explore', icon: '🧭' },
  { key: 'track', label: 'Track', icon: '⏱' },
  { key: 'profile', label: 'Profile', icon: '👤' },
  { key: 'settings', label: 'Settings', icon: '⚙️' },
];

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
  return (
    <nav
      style={{
        display: 'flex',
        borderTop: `1px solid ${theme.border}`,
        background: theme.surface,
        padding: '6px 4px 14px',
      }}
    >
      {TABS.map((t) => {
        const active = activeTab === t.key;
        return (
          <button
            key={t.key}
            onClick={() => onChangeTab(t.key)}
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
              fontSize: 11,
            }}
          >
            <span style={{ fontSize: 22, filter: active ? 'none' : 'grayscale(0.4)' }}>{t.icon}</span>
            {t.label}
          </button>
        );
      })}
    </nav>
  );
}
