import React from 'react';
import { ScrollView, View, type ViewStyle } from 'react-native';
import { useTheme, spacing } from '@minga/theme';

export function Screen({
  children,
  scroll = true,
  padded = true,
  style,
}: {
  children: React.ReactNode;
  scroll?: boolean;
  padded?: boolean;
  style?: ViewStyle;
}) {
  const { theme } = useTheme();
  const inner = padded
    ? { paddingHorizontal: spacing.lg, paddingBottom: spacing['3xl'], gap: spacing.lg }
    : undefined;
  const bg = { backgroundColor: theme.background, flex: 1 };
  if (scroll) {
    return (
      <ScrollView style={[bg, style as any]} contentContainerStyle={inner}>
        {children}
      </ScrollView>
    );
  }
  return <View style={[bg, inner, style as any]}>{children}</View>;
}
