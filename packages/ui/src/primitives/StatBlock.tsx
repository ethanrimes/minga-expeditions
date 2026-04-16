import React from 'react';
import { Text, View } from 'react-native';
import { useTheme, fontSizes, fontWeights, spacing } from '@minga/theme';

export function StatBlock({
  label,
  value,
  align = 'center',
}: {
  label: string;
  value: string;
  align?: 'center' | 'left';
}) {
  const { theme } = useTheme();
  return (
    <View style={{ alignItems: align === 'center' ? 'center' : 'flex-start', paddingVertical: spacing.xs }}>
      <Text style={{ color: theme.text, fontSize: fontSizes.xl, fontWeight: fontWeights.bold }}>{value}</Text>
      <Text
        style={{
          color: theme.textMuted,
          fontSize: fontSizes.xs,
          letterSpacing: 0.5,
          textTransform: 'uppercase',
          marginTop: 2,
        }}
      >
        {label}
      </Text>
    </View>
  );
}
