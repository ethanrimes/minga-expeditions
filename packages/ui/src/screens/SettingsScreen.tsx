import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useTheme, spacing, fontSizes, fontWeights, radii, type FontScaleLevel } from '@minga/theme';
import { useT } from '@minga/i18n';
import type { ThemeName } from '@minga/types';
import { Screen } from '../primitives/Screen';
import { Icon } from '../primitives/Icon';
import { SectionHeader } from '../components/SectionHeader';

const THEME_META: Record<ThemeName, { titleKey: any; subtitleKey: any; swatch: string }> = {
  livehappy: {
    titleKey: 'settings.theme.livehappy.title',
    subtitleKey: 'settings.theme.livehappy.subtitle',
    swatch: '#ED8B00',
  },
  'minga-green': {
    titleKey: 'settings.theme.mingaGreen.title',
    subtitleKey: 'settings.theme.mingaGreen.subtitle',
    swatch: '#2D7D32',
  },
  midnight: {
    titleKey: 'settings.theme.midnight.title',
    subtitleKey: 'settings.theme.midnight.subtitle',
    swatch: '#161B22',
  },
};

const FONT_LABEL_KEY: Record<FontScaleLevel, any> = {
  sm: 'settings.fontSizeSm',
  md: 'settings.fontSizeMd',
  lg: 'settings.fontSizeLg',
  xl: 'settings.fontSizeXl',
};

export function SettingsScreen() {
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
    <Screen>
      <View style={{ paddingTop: spacing.xl }}>
        <Text style={{ color: theme.text, fontSize: fontSizes['2xl'], fontWeight: fontWeights.heavy }}>
          {t('settings.title')}
        </Text>
      </View>

      <SectionHeader title={t('settings.language')} />
      <PillToggle
        options={langs.map((l) => ({
          key: l,
          label: l === 'en' ? t('settings.languageEn') : t('settings.languageEs'),
        }))}
        value={language}
        onChange={(v) => setLanguage(v as any)}
        theme={theme}
      />

      <SectionHeader title={t('settings.fontSize')} />
      <PillToggle
        options={availableFontScales.map((l) => ({ key: l, label: t(FONT_LABEL_KEY[l]) }))}
        value={fontScale}
        onChange={(v) => setFontScale(v as FontScaleLevel)}
        theme={theme}
      />

      <SectionHeader title={t('settings.theme')} />
      <View style={{ gap: spacing.sm }}>
        {available.map((name) => {
          const active = name === themeName;
          return (
            <Pressable
              key={name}
              onPress={() => setTheme(name)}
              style={{
                borderWidth: active ? 2 : 1,
                borderColor: active ? theme.primary : theme.border,
                backgroundColor: active ? theme.primaryMuted : theme.surface,
                borderRadius: radii.lg,
                padding: spacing.lg,
                flexDirection: 'row',
                gap: spacing.md,
                alignItems: 'center',
              }}
            >
              <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: THEME_META[name].swatch }} />
              <View style={{ flex: 1 }}>
                <Text style={{ color: theme.text, fontWeight: fontWeights.bold, fontSize: fontSizes.md }}>
                  {t(THEME_META[name].titleKey)}
                </Text>
                <Text style={{ color: theme.textMuted, fontSize: fontSizes.sm }}>
                  {t(THEME_META[name].subtitleKey)}
                </Text>
              </View>
              {active ? <Icon name="check" size={18} color={theme.primary} strokeWidth={3} /> : null}
            </Pressable>
          );
        })}
      </View>

      <SectionHeader title={t('settings.about')} />
      <Text style={{ color: theme.textMuted, fontSize: fontSizes.sm, lineHeight: 22 }}>{t('settings.aboutBody')}</Text>
    </Screen>
  );
}

function PillToggle({
  options,
  value,
  onChange,
  theme,
}: {
  options: { key: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
  theme: any;
}) {
  return (
    <View
      style={{
        alignSelf: 'flex-start',
        flexDirection: 'row',
        flexWrap: 'wrap',
        backgroundColor: theme.surfaceAlt,
        borderRadius: radii.pill,
        padding: 4,
        borderWidth: 1,
        borderColor: theme.border,
        maxWidth: '100%',
      }}
    >
      {options.map((opt) => {
        const active = opt.key === value;
        return (
          <Pressable
            key={opt.key}
            onPress={() => onChange(opt.key)}
            style={{
              backgroundColor: active ? theme.primary : 'transparent',
              paddingHorizontal: spacing.lg,
              paddingVertical: spacing.sm,
              borderRadius: radii.pill,
            }}
          >
            <Text
              style={{
                color: active ? theme.onPrimary : theme.text,
                fontWeight: fontWeights.bold,
                fontSize: fontSizes.sm,
              }}
            >
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
