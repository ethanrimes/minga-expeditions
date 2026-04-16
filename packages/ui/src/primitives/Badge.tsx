import React from 'react';
import { Text, View } from 'react-native';
import { useTheme, radii, spacing, fontSizes, fontWeights } from '@minga/theme';

export function Badge({
  label,
  color,
  textColor,
}: {
  label: string;
  color?: string;
  textColor?: string;
}) {
  const { theme } = useTheme();
  return (
    <View
      style={{
        backgroundColor: color ?? theme.primaryMuted,
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xxs + 1,
        borderRadius: radii.pill,
        alignSelf: 'flex-start',
      }}
    >
      <Text style={{ color: textColor ?? theme.primary, fontSize: fontSizes.xs, fontWeight: fontWeights.bold }}>
        {label}
      </Text>
    </View>
  );
}
