import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ThemeName } from '@minga/types';
import { themes, defaultThemeName, type ThemePalette } from './themes';

interface ThemeContextValue {
  theme: ThemePalette;
  themeName: ThemeName;
  setTheme: (name: ThemeName) => void;
  available: ThemeName[];
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

const STORAGE_KEY = 'minga.theme';

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

  useEffect(() => {
    (async () => {
      const stored = await persist.get(STORAGE_KEY);
      if (stored && stored in themes) setThemeName(stored as ThemeName);
    })();
  }, [persist]);

  const setTheme = (name: ThemeName) => {
    setThemeName(name);
    void persist.set(STORAGE_KEY, name);
  };

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme: themes[themeName],
      themeName,
      setTheme,
      available: Object.keys(themes) as ThemeName[],
    }),
    [themeName],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside <ThemeProvider>');
  return ctx;
}
