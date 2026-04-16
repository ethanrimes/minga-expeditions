import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useTheme, spacing, fontSizes, fontWeights, radii } from '@minga/theme';
import type { ThemeName } from '@minga/types';
import { Screen } from '../primitives/Screen';
import { SectionHeader } from '../components/SectionHeader';

const THEME_LABELS: Record<ThemeName, { title: string; subtitle: string }> = {
  livehappy: { title: 'Live Happy', subtitle: 'Bright orange · inspired by livehappy.com' },
  'minga-green': { title: 'Minga Green', subtitle: 'Outdoorsy forest palette' },
  midnight: { title: 'Midnight', subtitle: 'Dark mode for late rides' },
};

export function SettingsScreen() {
  const { theme, themeName, setTheme, available } = useTheme();

  return (
    <Screen>
      <View style={{ paddingTop: spacing.xl }}>
        <Text style={{ color: theme.text, fontSize: fontSizes['2xl'], fontWeight: fontWeights.heavy }}>Settings</Text>
      </View>

      <SectionHeader title="Theme" />
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
              <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: getSwatch(name) }} />
              <View style={{ flex: 1 }}>
                <Text style={{ color: theme.text, fontWeight: fontWeights.bold, fontSize: fontSizes.md }}>
                  {THEME_LABELS[name].title}
                </Text>
                <Text style={{ color: theme.textMuted, fontSize: fontSizes.sm }}>
                  {THEME_LABELS[name].subtitle}
                </Text>
              </View>
              {active ? (
                <Text style={{ color: theme.primary, fontWeight: fontWeights.bold }}>✓</Text>
              ) : null}
            </Pressable>
          );
        })}
      </View>

      <SectionHeader title="About" />
      <View style={{ gap: spacing.xs }}>
        <Text style={{ color: theme.text }}>Minga Expeditions · PoC build</Text>
        <Text style={{ color: theme.textMuted, fontSize: fontSizes.sm }}>
          Cross-platform mobile + web client for Colombia traveler community.
        </Text>
      </View>
    </Screen>
  );
}

function getSwatch(name: ThemeName): string {
  if (name === 'livehappy') return '#ED8B00';
  if (name === 'minga-green') return '#2D7D32';
  return '#161B22';
}
