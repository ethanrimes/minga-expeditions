import React from 'react';
import { useT } from '@minga/i18n';
import { Icon, type IconName } from '@minga/ui';
import { Battery, SignalHigh } from 'lucide-react-native';

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
        <SignalHigh size={14} color={theme.text} strokeWidth={2.5} />
        <Battery size={14} color={theme.text} strokeWidth={2.5} />
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
  const tabs: { key: TabKey; icon: IconName; label: string }[] = [
    { key: 'feed', icon: 'mountain', label: t('tab.feed') },
    { key: 'explore', icon: 'compass', label: t('tab.explore') },
    { key: 'map', icon: 'map', label: t('tab.map') },
    { key: 'track', icon: 'activity', label: t('tab.track') },
    { key: 'profile', icon: 'user', label: t('tab.profile') },
    { key: 'settings', icon: 'settings', label: t('tab.settings') },
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
              cursor: 'pointer',
            }}
          >
            <Icon
              name={tab.icon}
              size={22}
              color={active ? theme.primary : theme.textMuted}
              strokeWidth={active ? 2.4 : 2}
            />
            {tab.label}
          </button>
        );
      })}
    </nav>
  );
}
