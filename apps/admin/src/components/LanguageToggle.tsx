import { setLocaleAction } from '@/lib/i18n/actions';
import { dict, type Locale } from '@/lib/i18n/dictionary';

interface Props {
  current: Locale;
}

// Plain <form>s with hidden inputs — works without client-side JS so the
// sidebar stays a pure Server Component. Each button POSTs to the server
// action, which writes the cookie and revalidates the layout.
export function LanguageToggle({ current }: Props) {
  return (
    <div className="px-2 pb-3">
      <div className="text-[10px] uppercase tracking-wider text-ink-500 mb-1.5">
        {dict[current]['sidebar.language']}
      </div>
      <div className="flex gap-1">
        <LocaleButton locale="es" current={current} label={dict[current]['lang.spanish']} />
        <LocaleButton locale="en" current={current} label={dict[current]['lang.english']} />
      </div>
    </div>
  );
}

function LocaleButton({
  locale,
  current,
  label,
}: {
  locale: Locale;
  current: Locale;
  label: string;
}) {
  const active = locale === current;
  return (
    <form action={setLocaleAction} className="flex-1">
      <input type="hidden" name="locale" value={locale} />
      <button
        type="submit"
        aria-pressed={active}
        className={
          active
            ? 'w-full px-2 py-1 rounded-md bg-ink-900 text-white text-xs font-semibold'
            : 'w-full px-2 py-1 rounded-md bg-surface border border-surface-border text-ink-700 hover:bg-surface-alt text-xs'
        }
      >
        {label}
      </button>
    </form>
  );
}
