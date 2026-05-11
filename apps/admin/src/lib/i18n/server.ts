import 'server-only';
import { cookies } from 'next/headers';
import { DEFAULT_LOCALE, dict, translate, type Key, type Locale } from './dictionary';

export const LOCALE_COOKIE = 'minga-admin-locale';

function coerce(value: string | undefined): Locale {
  return value === 'en' || value === 'es' ? value : DEFAULT_LOCALE;
}

export async function getLocale(): Promise<Locale> {
  const store = await cookies();
  return coerce(store.get(LOCALE_COOKIE)?.value);
}

export interface ServerT {
  locale: Locale;
  t: (key: Key, vars?: Record<string, string | number>) => string;
  dict: Record<Key, string>;
}

export async function getT(): Promise<ServerT> {
  const locale = await getLocale();
  return {
    locale,
    t: (key, vars) => translate(locale, key, vars),
    dict: dict[locale],
  };
}
