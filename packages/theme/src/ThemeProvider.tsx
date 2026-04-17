import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ThemeName } from '@minga/types';
import { themes, defaultThemeName, type ThemePalette } from './themes';
import { _setFontScale } from './tokens';

export type FontScaleLevel = 'sm' | 'md' | 'lg' | 'xl';

// Multiplier per level. fontSizes.* reads are multiplied by this value at
// access time via the Proxy in tokens.ts, so every `fontSizes.md` call-site
// picks up the user's choice without any refactor.
export const FONT_SCALES: Record<FontScaleLevel, number> = {
  sm: 0.9,
  md: 1.0,
  lg: 1.15,
  xl: 1.3,
};

export const defaultFontScale: FontScaleLevel = 'md';

interface ThemeContextValue {
  theme: ThemePalette;
  themeName: ThemeName;
  setTheme: (name: ThemeName) => void;
  available: ThemeName[];
  fontScale: FontScaleLevel;
  setFontScale: (level: FontScaleLevel) => void;
  availableFontScales: FontScaleLevel[];
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

interface Persist {
  get: (key: string) => string | null | Promise<string | null>;
  set: (key: string, value: string) => void | Promise<void>;
}

// Default persist: localStorage on web, no-op elsewhere. The RN app injects AsyncStorage.
const defaultPersist: Persist = {
  get: (k) => (typeof window !== 'undefined' ? window.localStorage.getItem(k) : null),
  set: (k, v) => {
    if (typeof window !== 'undefined') window.localStorage.setItem(k, v);
  },
};

const THEME_STORAGE_KEY = 'minga.theme';
const FONT_STORAGE_KEY = 'minga.fontScale';

export function ThemeProvider({
  children,
  initial,
  persist = defaultPersist,
}: {
  children: React.ReactNode;
  initial?: ThemeName;
  persist?: Persist;
}) {
  const [themeName, setThemeName] = useState<ThemeName>(initial ?? defaultThemeName);
  const [fontScale, setFontScaleState] = useState<FontScaleLevel>(defaultFontScale);

  // Keep the proxy in sync with state on every change, not just on first load.
  // Without this, the initial render of <App /> would use _fontScale = 1
  // until the stored value comes back from AsyncStorage.
  _setFontScale(FONT_SCALES[fontScale]);

  useEffect(() => {
    (async () => {
      const [storedTheme, storedFont] = await Promise.all([
        persist.get(THEME_STORAGE_KEY),
        persist.get(FONT_STORAGE_KEY),
      ]);
      if (storedTheme && storedTheme in themes) setThemeName(storedTheme as ThemeName);
      if (storedFont && storedFont in FONT_SCALES) {
        const level = storedFont as FontScaleLevel;
        setFontScaleState(level);
        _setFontScale(FONT_SCALES[level]);
      }
    })();
  }, [persist]);

  const setTheme = (name: ThemeName) => {
    setThemeName(name);
    void persist.set(THEME_STORAGE_KEY, name);
  };

  const setFontScale = (level: FontScaleLevel) => {
    setFontScaleState(level);
    _setFontScale(FONT_SCALES[level]);
    void persist.set(FONT_STORAGE_KEY, level);
  };

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme: themes[themeName],
      themeName,
      setTheme,
      available: Object.keys(themes) as ThemeName[],
      fontScale,
      setFontScale,
      availableFontScales: Object.keys(FONT_SCALES) as FontScaleLevel[],
    }),
    [themeName, fontScale],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside <ThemeProvider>');
  return ctx;
}
