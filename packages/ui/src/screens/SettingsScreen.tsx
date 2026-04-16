import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useTheme, spacing, fontSizes, fontWeights, radii } from '@minga/theme';
import { useT } from '@minga/i18n';
import type { ThemeName } from '@minga/types';
import { Screen } from '../primitives/Screen';
import { SectionHeader } from '../components/SectionHeader';

const THEME_META: Record<ThemeName, { title: string; subtitle: string; swatch: string }> = {
  livehappy: { title: 'Live Happy', subtitle: 'Bright orange · inspired by livehappy.com', swatch: '#ED8B00' },
  'minga-green': { title: 'Minga Green', subtitle: 'Outdoorsy forest palette', swatch: '#2D7D32' },
  midnight: { title: 'Midnight', subtitle: 'Dark mode for late rides', swatch: '#161B22' },
};

export function SettingsScreen() {
  const { theme, themeName, setTheme, available } = useTheme();
  const { t, language, setLanguage, available: langs } = useT();

  return (
    <Screen>
      <View style={{ paddingTop: spacing.xl }}>
        <Text style={{ color: theme.text, fontSize: fontSizes['2xl'], fontWeight: fontWeights.heavy }}>
          {t('settings.title')}
        </Text>
      </View>

      <SectionHeader title={t('settings.language')} />
      <View
        style={{
          alignSelf: 'flex-start',
          flexDirection: 'row',
          backgroundColor: theme.surfaceAlt,
          borderRadius: radii.pill,
          padding: 4,
          borderWidth: 1,
          borderColor: theme.border,
        }}
      >
        {langs.map((l) => {
          const active = l === language;
          const label = l === 'en' ? t('settings.languageEn') : t('settings.languageEs');
          return (
            <Pressable
              key={l}
              onPress={() => setLanguage(l)}
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
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>

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
                  {THEME_META[name].title}
                </Text>
                <Text style={{ color: theme.textMuted, fontSize: fontSizes.sm }}>
                  {THEME_META[name].subtitle}
                </Text>
              </View>
              {active ? <Text style={{ color: theme.primary, fontWeight: fontWeights.bold }}>✓</Text> : null}
            </Pressable>
          );
        })}
      </View>

      <SectionHeader title={t('settings.about')} />
      <Text style={{ color: theme.textMuted, fontSize: fontSizes.sm, lineHeight: 22 }}>{t('settings.aboutBody')}</Text>
    </Screen>
  );
}
