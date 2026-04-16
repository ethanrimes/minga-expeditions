import React from 'react';
import { Pressable, Text } from 'react-native';
import { useTheme, radii, spacing, fontSizes, fontWeights } from '@minga/theme';

export function CategoryChip({
  label,
  onPress,
  active,
}: {
  label: string;
  onPress?: () => void;
  active?: boolean;
}) {
  const { theme } = useTheme();
  const bg = active ? theme.primary : theme.surfaceAlt;
  const fg = active ? theme.onPrimary : theme.text;
  const Cmp: any = onPress ? Pressable : Text;
  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={{
          backgroundColor: bg,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
          borderRadius: radii.pill,
        }}
      >
        <Text style={{ color: fg, fontWeight: fontWeights.semibold, fontSize: fontSizes.sm }}>{label}</Text>
      </Pressable>
    );
  }
  return (
    <Text
      style={{
        backgroundColor: theme.primary,
        color: theme.onPrimary,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xxs + 2,
        borderRadius: radii.sm,
        fontWeight: fontWeights.bold,
        fontSize: fontSizes.xs,
        overflow: 'hidden',
      }}
    >
      {label.toUpperCase()}
    </Text>
  );
}
