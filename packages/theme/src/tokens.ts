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

// Raw base-size font tokens.
const BASE_FONT_SIZES = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 22,
  '2xl': 28,
  '3xl': 36,
  display: 48,
} as const;

export type FontSize = keyof typeof BASE_FONT_SIZES;

// Runtime-mutable font scale multiplier. The Proxy below multiplies every
// fontSizes.* read by this value, so every existing `fontSizes.md` call site
// picks up the user's selected size on the next render — no refactor needed.
// ThemeProvider owns the writer; see `_setFontScale` below.
let _fontScale = 1;

export function _setFontScale(v: number) {
  _fontScale = v;
}
export function _getFontScale() {
  return _fontScale;
}

export const fontSizes: Record<FontSize, number> = new Proxy(
  { ...BASE_FONT_SIZES },
  {
    get(target, key: string) {
      if (key in target) {
        return Math.round(target[key as FontSize] * _fontScale);
      }
      return undefined as unknown as number;
    },
  },
) as unknown as Record<FontSize, number>;

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
