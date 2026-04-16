import React from 'react';
import { Text, TextInput, View, type TextInputProps } from 'react-native';
import { useTheme, radii, spacing, fontSizes, fontWeights } from '@minga/theme';

export interface InputProps extends TextInputProps {
  label?: string;
  helper?: string;
  error?: string;
}

export function Input({ label, helper, error, style, ...rest }: InputProps) {
  const { theme } = useTheme();
  return (
    <View style={{ gap: spacing.xs, alignSelf: 'stretch' }}>
      {label ? (
        <Text style={{ color: theme.text, fontWeight: fontWeights.semibold, fontSize: fontSizes.sm }}>{label}</Text>
      ) : null}
      <TextInput
        {...rest}
        placeholderTextColor={theme.textMuted}
        style={[
          {
            borderWidth: 1,
            borderColor: error ? theme.danger : theme.border,
            borderRadius: radii.md,
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.sm + 2,
            color: theme.text,
            backgroundColor: theme.surface,
            fontSize: fontSizes.md,
          },
          style as any,
        ]}
      />
      {error ? (
        <Text style={{ color: theme.danger, fontSize: fontSizes.xs }}>{error}</Text>
      ) : helper ? (
        <Text style={{ color: theme.textMuted, fontSize: fontSizes.xs }}>{helper}</Text>
      ) : null}
    </View>
  );
}
