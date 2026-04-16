import type { ThemeName } from '@minga/types';

// Theme palette — the livehappy variant mirrors the brand from livehappy.com:
// bright orange primary on white, warm sand neutrals, clean dark text.
// minga-green adds an outdoorsy alternate; midnight is the dark mode.

export interface ThemePalette {
  name: ThemeName;
  mode: 'light' | 'dark';
  background: string;
  surface: string;
  surfaceAlt: string;
  border: string;
  text: string;
  textMuted: string;
  textInverse: string;
  primary: string;
  primaryHover: string;
  primaryMuted: string;
  onPrimary: string;
  accent: string;
  success: string;
  warning: string;
  danger: string;
  overlay: string;
  categoryChipBg: string;
  categoryChipText: string;
}

export const themes: Record<ThemeName, ThemePalette> = {
  livehappy: {
    name: 'livehappy',
    mode: 'light',
    background: '#FFFFFF',
    surface: '#FFFFFF',
    surfaceAlt: '#FFF8EC',
    border: '#F1E3C8',
    text: '#1F1A13',
    textMuted: '#6C5F4B',
    textInverse: '#FFFFFF',
    primary: '#ED8B00', // livehappy orange
    primaryHover: '#D57A00',
    primaryMuted: '#FFE3B8',
    onPrimary: '#FFFFFF',
    accent: '#F5A623',
    success: '#3BA55C',
    warning: '#E5A000',
    danger: '#D23F3F',
    overlay: 'rgba(31, 26, 19, 0.55)',
    categoryChipBg: '#ED8B00',
    categoryChipText: '#FFFFFF',
  },
  'minga-green': {
    name: 'minga-green',
    mode: 'light',
    background: '#F7FBF5',
    surface: '#FFFFFF',
    surfaceAlt: '#ECF5E8',
    border: '#CFE3C6',
    text: '#12231A',
    textMuted: '#5E7A68',
    textInverse: '#FFFFFF',
    primary: '#2D7D32',
    primaryHover: '#1F5F24',
    primaryMuted: '#C5E4C8',
    onPrimary: '#FFFFFF',
    accent: '#F5A623',
    success: '#3BA55C',
    warning: '#E5A000',
    danger: '#D23F3F',
    overlay: 'rgba(18, 35, 26, 0.55)',
    categoryChipBg: '#2D7D32',
    categoryChipText: '#FFFFFF',
  },
  midnight: {
    name: 'midnight',
    mode: 'dark',
    background: '#0E1116',
    surface: '#161B22',
    surfaceAlt: '#1C222B',
    border: '#2A313C',
    text: '#F3F4F6',
    textMuted: '#9AA4B2',
    textInverse: '#0E1116',
    primary: '#ED8B00',
    primaryHover: '#FFA52B',
    primaryMuted: '#3A2A10',
    onPrimary: '#0E1116',
    accent: '#F5A623',
    success: '#52D17F',
    warning: '#F1C232',
    danger: '#E66363',
    overlay: 'rgba(0, 0, 0, 0.65)',
    categoryChipBg: '#ED8B00',
    categoryChipText: '#0E1116',
  },
};

export const defaultThemeName: ThemeName = 'livehappy';
