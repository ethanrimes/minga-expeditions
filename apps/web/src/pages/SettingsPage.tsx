import React from 'react';
import { useTheme } from '@minga/theme';
import type { ThemeName } from '@minga/types';

const META: Record<ThemeName, { title: string; subtitle: string; swatch: string }> = {
  livehappy: { title: 'Live Happy', subtitle: 'Bright orange · inspired by livehappy.com', swatch: '#ED8B00' },
  'minga-green': { title: 'Minga Green', subtitle: 'Outdoorsy forest palette', swatch: '#2D7D32' },
  midnight: { title: 'Midnight', subtitle: 'Dark mode for late rides', swatch: '#161B22' },
};

export function SettingsPage() {
  const { theme, themeName, setTheme, available } = useTheme();
  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '40px 24px' }}>
      <h1 style={{ color: theme.text }}>Settings</h1>

      <h2 style={{ color: theme.text, marginTop: 32 }}>Theme</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
        {available.map((name) => {
          const active = name === themeName;
          return (
            <button
              key={name}
              onClick={() => setTheme(name)}
              style={{
                textAlign: 'left',
                background: active ? theme.primaryMuted : theme.surface,
                border: `${active ? 2 : 1}px solid ${active ? theme.primary : theme.border}`,
                borderRadius: 16,
                padding: 18,
                display: 'flex',
                gap: 14,
                alignItems: 'center',
              }}
            >
              <div style={{ width: 40, height: 40, borderRadius: 999, background: META[name].swatch }} />
              <div style={{ flex: 1 }}>
                <div style={{ color: theme.text, fontWeight: 800 }}>{META[name].title}</div>
                <div style={{ color: theme.textMuted, fontSize: 13 }}>{META[name].subtitle}</div>
              </div>
              {active ? <span style={{ color: theme.primary, fontWeight: 800 }}>✓</span> : null}
            </button>
          );
        })}
      </div>

      <h2 style={{ color: theme.text, marginTop: 40 }}>About</h2>
      <p style={{ color: theme.textMuted, lineHeight: 1.6 }}>
        This is the proof-of-concept build of Minga Expeditions — a cross-platform traveler-community app for
        Colombia. The same code powers the phone app, the mobile-look debug web app, and this desktop website.
      </p>
    </div>
  );
}
