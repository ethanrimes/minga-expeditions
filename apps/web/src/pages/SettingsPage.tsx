import React from 'react';
import { useTheme, type FontScaleLevel } from '@minga/theme';
import { useT } from '@minga/i18n';
import type { ThemeName } from '@minga/types';

const META: Record<ThemeName, { title: string; subtitle: string; swatch: string }> = {
  livehappy: { title: 'Live Happy', subtitle: 'Bright orange · inspired by livehappy.com', swatch: '#ED8B00' },
  'minga-green': { title: 'Minga Green', subtitle: 'Outdoorsy forest palette', swatch: '#2D7D32' },
  midnight: { title: 'Midnight', subtitle: 'Dark mode for late rides', swatch: '#161B22' },
};

const FONT_LABEL_KEY: Record<FontScaleLevel, any> = {
  sm: 'settings.fontSizeSm',
  md: 'settings.fontSizeMd',
  lg: 'settings.fontSizeLg',
  xl: 'settings.fontSizeXl',
};

export function SettingsPage() {
  const {
    theme,
    themeName,
    setTheme,
    available,
    fontScale,
    setFontScale,
    availableFontScales,
  } = useTheme();
  const { t, language, setLanguage, available: langs } = useT();

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '40px 24px' }}>
      <h1 style={{ color: theme.text }}>{t('settings.title')}</h1>

      <h2 style={{ color: theme.text, marginTop: 32 }}>{t('settings.language')}</h2>
      <Pill theme={theme} options={langs.map((l) => ({ key: l, label: l === 'en' ? t('settings.languageEn') : t('settings.languageEs') }))} value={language} onChange={(v) => setLanguage(v as any)} />

      <h2 style={{ color: theme.text, marginTop: 40 }}>{t('settings.fontSize')}</h2>
      <Pill
        theme={theme}
        options={availableFontScales.map((l) => ({ key: l, label: t(FONT_LABEL_KEY[l]) }))}
        value={fontScale}
        onChange={(v) => setFontScale(v as FontScaleLevel)}
      />

      <h2 style={{ color: theme.text, marginTop: 40 }}>{t('settings.theme')}</h2>
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

      <h2 style={{ color: theme.text, marginTop: 40 }}>{t('settings.about')}</h2>
      <p style={{ color: theme.textMuted, lineHeight: 1.6 }}>{t('settings.aboutBody')}</p>
    </div>
  );
}

function Pill({
  theme,
  options,
  value,
  onChange,
}: {
  theme: any;
  options: { key: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div
      style={{
        display: 'inline-flex',
        background: theme.surfaceAlt,
        borderRadius: 999,
        padding: 4,
        border: `1px solid ${theme.border}`,
        flexWrap: 'wrap',
      }}
    >
      {options.map((opt) => {
        const active = opt.key === value;
        return (
          <button
            key={opt.key}
            onClick={() => onChange(opt.key)}
            style={{
              background: active ? theme.primary : 'transparent',
              color: active ? theme.onPrimary : theme.text,
              border: 0,
              padding: '8px 20px',
              borderRadius: 999,
              fontWeight: 700,
              fontSize: 14,
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
