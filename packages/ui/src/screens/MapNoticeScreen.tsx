import React from 'react';
import { Text, View } from 'react-native';
import { useTheme, spacing, fontSizes, fontWeights } from '@minga/theme';
import { useT } from '@minga/i18n';
import { Screen } from '../primitives/Screen';

// Native placeholder — the interactive MapLibre GL JS surface lives in the web
// apps. The iOS/Android app can swap this for `@maplibre/maplibre-react-native`
// or `react-native-maps` later without touching the web code.
export function MapNoticeScreen() {
  const { theme } = useTheme();
  const { t } = useT();
  return (
    <Screen>
      <View style={{ paddingTop: spacing['2xl'], gap: spacing.md, alignItems: 'center' }}>
        <Text style={{ fontSize: 64 }}>🗺️</Text>
        <Text style={{ color: theme.text, fontSize: fontSizes['2xl'], fontWeight: fontWeights.heavy, textAlign: 'center' }}>
          {t('map.title')}
        </Text>
        <Text style={{ color: theme.textMuted, textAlign: 'center', lineHeight: 22, paddingHorizontal: spacing.lg }}>
          {t('map.nativeNotice')}
        </Text>
      </View>
    </Screen>
  );
}
