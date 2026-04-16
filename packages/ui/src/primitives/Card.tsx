import React from 'react';
import { View, type ViewStyle } from 'react-native';
import { useTheme, radii, spacing } from '@minga/theme';

export function Card({
  children,
  style,
  flat,
  padded = true,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
  flat?: boolean;
  padded?: boolean;
}) {
  const { theme } = useTheme();
  return (
    <View
      style={{
        backgroundColor: theme.surface,
        borderRadius: radii.lg,
        borderWidth: flat ? 0 : 1,
        borderColor: theme.border,
        padding: padded ? spacing.lg : 0,
        ...style,
      }}
    >
      {children}
    </View>
  );
}
