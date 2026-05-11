'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { LOCALES, type Locale } from './dictionary';
import { LOCALE_COOKIE } from './server';

// Sets the locale cookie used by getLocale() and revalidates every route so
// SSR'd strings on the current page repaint in the new language.
export async function setLocaleAction(formData: FormData) {
  const raw = String(formData.get('locale') ?? '');
  if (!LOCALES.includes(raw as Locale)) return;

  const store = await cookies();
  store.set(LOCALE_COOKIE, raw, {
    path: '/',
    sameSite: 'lax',
    httpOnly: false,
    maxAge: 60 * 60 * 24 * 365,
  });
  revalidatePath('/', 'layout');
}
