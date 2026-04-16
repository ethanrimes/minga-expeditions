import React from 'react';
import { Pressable, Text, ActivityIndicator, type PressableProps, type ViewStyle, type TextStyle } from 'react-native';
import { useTheme, radii, spacing, fontSizes, fontWeights } from '@minga/theme';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

export interface ButtonProps extends Omit<PressableProps, 'children' | 'style'> {
  label: string;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  style?: ViewStyle;
}

export function Button({
  label,
  variant = 'primary',
  size = 'md',
  loading,
  fullWidth,
  leftIcon,
  rightIcon,
  style,
  disabled,
  ...rest
}: ButtonProps) {
  const { theme } = useTheme();

  const bg = variant === 'primary'
    ? theme.primary
    : variant === 'danger'
      ? theme.danger
      : variant === 'secondary'
        ? theme.surfaceAlt
        : 'transparent';

  const border = variant === 'ghost' || variant === 'secondary' ? theme.border : 'transparent';
  const fg = variant === 'primary' || variant === 'danger' ? theme.onPrimary : theme.text;

  const paddingY = size === 'sm' ? spacing.sm : size === 'lg' ? spacing.lg : spacing.md;
  const paddingX = size === 'sm' ? spacing.md : size === 'lg' ? spacing.xl : spacing.lg;
  const fontSize = size === 'sm' ? fontSizes.sm : size === 'lg' ? fontSizes.lg : fontSizes.md;

  const containerStyle: ViewStyle = {
    backgroundColor: bg,
    borderColor: border,
    borderWidth: variant === 'ghost' || variant === 'secondary' ? 1 : 0,
    borderRadius: radii.pill,
    paddingVertical: paddingY,
    paddingHorizontal: paddingX,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    alignSelf: fullWidth ? 'stretch' : 'flex-start',
    opacity: disabled || loading ? 0.6 : 1,
    ...style,
  };

  const textStyle: TextStyle = {
    color: fg,
    fontSize,
    fontWeight: fontWeights.semibold,
  };

  return (
    <Pressable {...rest} disabled={disabled || loading} style={containerStyle}>
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <>
          {leftIcon}
          <Text style={textStyle}>{label}</Text>
          {rightIcon}
        </>
      )}
    </Pressable>
  );
}
