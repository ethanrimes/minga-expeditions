import React from 'react';
import { Text, View } from 'react-native';
import { useTheme, spacing, fontSizes, fontWeights } from '@minga/theme';

export function EmptyState({ title, body, icon }: { title: string; body?: string; icon?: string }) {
  const { theme } = useTheme();
  return (
    <View style={{ alignItems: 'center', padding: spacing['2xl'], gap: spacing.sm }}>
      {icon ? <Text style={{ fontSize: 48 }}>{icon}</Text> : null}
      <Text style={{ color: theme.text, fontSize: fontSizes.lg, fontWeight: fontWeights.bold, textAlign: 'center' }}>
        {title}
      </Text>
      {body ? (
        <Text style={{ color: theme.textMuted, fontSize: fontSizes.sm, textAlign: 'center' }}>{body}</Text>
      ) : null}
    </View>
  );
}
