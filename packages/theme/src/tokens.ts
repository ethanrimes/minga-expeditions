// Design tokens shared across themes. Only values that should stay constant regardless of light/dark or brand variant.

export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  '2xl': 32,
  '3xl': 48,
  '4xl': 64,
} as const;

export const radii = {
  none: 0,
  sm: 6,
  md: 10,
  lg: 16,
  xl: 24,
  pill: 999,
} as const;

export const fontSizes = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 22,
  '2xl': 28,
  '3xl': 36,
  display: 48,
} as const;

export const fontWeights = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  heavy: '800',
} as const;

export const tierColors = {
  bronze: '#B87333',
  silver: '#8E9AAF',
  gold: '#E6B325',
  diamond: '#5BCEFA',
} as const;

export type Spacing = keyof typeof spacing;
export type Radius = keyof typeof radii;
export type FontSize = keyof typeof fontSizes;
