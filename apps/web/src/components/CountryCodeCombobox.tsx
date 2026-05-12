import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, Search } from 'lucide-react';
import { useTheme } from '@minga/theme';
import { useT } from '@minga/i18n';
import { COUNTRY_CODES, findCountry, searchCountries } from '@minga/logic';

export interface Props {
  value: string;
  onChange: (code: string, iso: string) => void;
  iso?: string;
  disabled?: boolean;
}

export function CountryCodeCombobox({ value, onChange, iso, disabled }: Props) {
  const { theme } = useTheme();
  const { t } = useT();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const selected = useMemo(() => findCountry(value, iso) ?? COUNTRY_CODES[0], [value, iso]);
  const results = useMemo(() => searchCountries(query), [query]);

  // Close on outside click + Esc. Re-focus the search input when opening.
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    setTimeout(() => inputRef.current?.focus(), 0);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          background: theme.surfaceAlt,
          color: theme.text,
          border: `1px solid ${theme.border}`,
          borderRadius: 10,
          padding: '10px 12px',
          fontSize: 14,
          fontWeight: 600,
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.6 : 1,
          whiteSpace: 'nowrap',
        }}
      >
        <span style={{ fontSize: 18, lineHeight: 1 }}>{selected.flag}</span>
        <span>{selected.code}</span>
        <ChevronDown size={14} strokeWidth={2.2} />
      </button>
      {open ? (
        <div
          role="listbox"
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            zIndex: 50,
            width: 320,
            maxWidth: 'calc(100vw - 32px)',
            background: theme.background,
            border: `1px solid ${theme.border}`,
            borderRadius: 12,
            boxShadow: '0 20px 40px rgba(0,0,0,0.18)',
            display: 'flex',
            flexDirection: 'column',
            maxHeight: 360,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 12px',
              borderBottom: `1px solid ${theme.border}`,
            }}
          >
            <Search size={16} color={theme.textMuted} strokeWidth={2.2} />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('profile.countrySearchPlaceholder')}
              autoCapitalize="none"
              autoCorrect="off"
              style={{
                flex: 1,
                background: 'transparent',
                color: theme.text,
                border: 0,
                outline: 'none',
                fontSize: 14,
              }}
            />
          </div>
          <div style={{ overflowY: 'auto' }}>
            {results.map((c) => {
              const active = c.iso === selected.iso && c.code === selected.code;
              return (
                <button
                  key={`${c.iso}-${c.code}`}
                  type="button"
                  role="option"
                  aria-selected={active}
                  onClick={() => {
                    onChange(c.code, c.iso);
                    setOpen(false);
                    setQuery('');
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    width: '100%',
                    background: active ? theme.primaryMuted : 'transparent',
                    color: theme.text,
                    border: 0,
                    padding: '10px 12px',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <span style={{ fontSize: 20, lineHeight: 1 }}>{c.flag}</span>
                  <span style={{ flex: 1, fontSize: 14, fontWeight: 600 }}>{c.name}</span>
                  <span style={{ color: theme.textMuted, fontSize: 13, fontWeight: 600 }}>{c.code}</span>
                </button>
              );
            })}
            {results.length === 0 ? (
              <div style={{ padding: 16, color: theme.textMuted, fontSize: 13 }}>—</div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
