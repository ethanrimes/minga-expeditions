import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { dictionaries, defaultLanguage, type LanguageCode, type TranslationKey } from './dictionaries';

interface Persist {
  get: (key: string) => string | null | Promise<string | null>;
  set: (key: string, value: string) => void | Promise<void>;
}

const STORAGE_KEY = 'minga.language';

const defaultPersist: Persist = {
  get: (k) => (typeof window !== 'undefined' ? window.localStorage.getItem(k) : null),
  set: (k, v) => {
    if (typeof window !== 'undefined') window.localStorage.setItem(k, v);
  },
};

interface Ctx {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
  available: LanguageCode[];
}

const LanguageContext = createContext<Ctx | null>(null);

export function LanguageProvider({
  children,
  initial,
  persist = defaultPersist,
}: {
  children: React.ReactNode;
  initial?: LanguageCode;
  persist?: Persist;
}) {
  const [language, setLang] = useState<LanguageCode>(initial ?? defaultLanguage);

  useEffect(() => {
    (async () => {
      const stored = await persist.get(STORAGE_KEY);
      if (stored && stored in dictionaries) setLang(stored as LanguageCode);
    })();
  }, [persist]);

  const setLanguage = (lang: LanguageCode) => {
    setLang(lang);
    void persist.set(STORAGE_KEY, lang);
  };

  const value = useMemo<Ctx>(
    () => ({
      language,
      setLanguage,
      t: (key, vars) => {
        let s = dictionaries[language][key] ?? dictionaries.en[key] ?? key;
        if (vars) {
          for (const [k, v] of Object.entries(vars)) {
            s = s.split(`{${k}}`).join(String(v));
          }
        }
        return s;
      },
      available: Object.keys(dictionaries) as LanguageCode[],
    }),
    [language],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useT() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useT must be used inside <LanguageProvider>');
  return ctx;
}
