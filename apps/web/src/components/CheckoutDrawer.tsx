import React, { useEffect, useState } from 'react';
import { useTheme } from '@minga/theme';
import { formatPriceCents } from '@minga/logic';
import { useT } from '@minga/i18n';
import { supabase } from '../supabase';

type CheckoutMode = 'collect-info' | 'opening-widget' | 'redirecting';

interface Props {
  expeditionId: string;
  expeditionTitle: string;
  priceCents: number;
  currency: string;
  onClose: () => void;
}

const env = import.meta.env as unknown as Record<string, string>;
const FUNCTIONS_BASE = `${env.VITE_SUPABASE_URL}/functions/v1`;

// Wompi widget loader — script tag that becomes a global form-renderer.
// Reference: https://docs.wompi.co/docs/colombia/widget-checkout-web
function loadWompiScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector('script[data-wompi-widget]')) return resolve();
    const s = document.createElement('script');
    s.src = 'https://checkout.wompi.co/widget.js';
    s.async = true;
    s.dataset.wompiWidget = 'true';
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('Failed to load Wompi widget'));
    document.head.appendChild(s);
  });
}

interface WompiCheckoutOptions {
  currency: string;
  amountInCents: number;
  reference: string;
  publicKey: string;
  signature: { integrity: string };
  redirectUrl: string;
  customerData?: { email?: string; fullName?: string; phoneNumber?: string };
}

interface WompiCheckoutInstance {
  open(cb: (result: { transaction: { id: string; status: string } | null }) => void): void;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  interface Window {
    WidgetCheckout?: new (opts: WompiCheckoutOptions) => WompiCheckoutInstance;
  }
}

export function CheckoutDrawer({
  expeditionId,
  expeditionTitle,
  priceCents,
  currency,
  onClose,
}: Props) {
  const { theme } = useTheme();
  const { t } = useT();
  const [mode, setMode] = useState<CheckoutMode>('collect-info');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email.trim() && !phone.trim()) {
      setError('Add at least one contact method (email or WhatsApp).');
      return;
    }
    setMode('opening-widget');
    try {
      const session = await supabase.auth.getSession();
      const accessToken = session.data.session?.access_token;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
      const res = await fetch(`${FUNCTIONS_BASE}/wompi-create-order`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          expedition_id: expeditionId,
          guest: {
            email: email.trim() || undefined,
            phone: phone.trim() || undefined,
            display_name: name.trim() || undefined,
          },
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Could not start checkout');

      await loadWompiScript();
      if (!window.WidgetCheckout) throw new Error('Wompi widget unavailable');

      const checkout = new window.WidgetCheckout({
        currency: json.currency,
        amountInCents: json.amountInCents,
        reference: json.reference,
        publicKey: json.publicKey,
        signature: { integrity: json.signature },
        redirectUrl: json.redirectUrl,
        customerData: {
          email: email.trim() || undefined,
          fullName: name.trim() || undefined,
          phoneNumber: phone.trim() || undefined,
        },
      });

      setMode('redirecting');
      checkout.open(() => {
        // The widget closes either after payment (Wompi navigates the page)
        // or if the user dismisses. Either way we let the redirect take over;
        // if the user dismissed, leave them on the expedition page.
      });
    } catch (err) {
      setError((err as Error).message);
      setMode('collect-info');
    }
  };

  return (
    <div
      role="dialog"
      aria-modal
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.45)',
        zIndex: 100,
        display: 'flex',
        justifyContent: 'flex-end',
      }}
    >
      <div
        style={{
          width: 'min(420px, 100vw)',
          height: '100vh',
          background: theme.background,
          display: 'flex',
          flexDirection: 'column',
          padding: 24,
          overflowY: 'auto',
        }}
      >
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ color: theme.textMuted, fontSize: 12, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase' }}>
              Checkout
            </div>
            <div style={{ color: theme.text, fontSize: 18, fontWeight: 700, marginTop: 4 }}>{expeditionTitle}</div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              background: 'transparent',
              border: 0,
              color: theme.textMuted,
              fontSize: 24,
              cursor: 'pointer',
            }}
          >
            ×
          </button>
        </header>

        <div
          style={{
            margin: '24px 0',
            padding: 16,
            background: theme.surfaceAlt,
            borderRadius: 12,
            color: theme.text,
            fontSize: 22,
            fontWeight: 800,
          }}
        >
          {formatPriceCents(priceCents, { currency, freeLabel: t('common.free') })}
        </div>

        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Field label="Your name" theme={theme}>
            <Input value={name} onChange={setName} theme={theme} placeholder="Optional" />
          </Field>
          <Field label="Email" theme={theme}>
            <Input value={email} onChange={setEmail} type="email" theme={theme} placeholder="you@email.com" />
          </Field>
          <Field label="WhatsApp phone" theme={theme}>
            <Input value={phone} onChange={setPhone} type="tel" theme={theme} placeholder="+57 …" />
          </Field>

          <p style={{ color: theme.textMuted, fontSize: 12 }}>
            We send the booking confirmation to whichever contact method you provide. WhatsApp is preferred.
          </p>

          {error ? <div style={{ color: theme.danger, fontSize: 14 }}>{error}</div> : null}

          <button
            type="submit"
            disabled={mode !== 'collect-info'}
            style={{
              background: theme.primary,
              color: theme.onPrimary,
              border: 0,
              borderRadius: 999,
              padding: '14px 22px',
              fontWeight: 800,
              fontSize: 16,
              cursor: mode === 'collect-info' ? 'pointer' : 'wait',
              opacity: mode === 'collect-info' ? 1 : 0.7,
            }}
          >
            {mode === 'collect-info' ? 'Pay with Wompi' : mode === 'opening-widget' ? 'Opening checkout…' : 'Redirecting…'}
          </button>
        </form>
      </div>
    </div>
  );
}

function Field({ label, theme, children }: { label: string; theme: ReturnType<typeof useTheme>['theme']; children: React.ReactNode }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span style={{ color: theme.text, fontSize: 12, fontWeight: 700, letterSpacing: 0.3 }}>{label}</span>
      {children}
    </label>
  );
}

function Input({
  value,
  onChange,
  type = 'text',
  placeholder,
  theme,
}: {
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  theme: ReturnType<typeof useTheme>['theme'];
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        background: theme.surface,
        color: theme.text,
        border: `1px solid ${theme.border}`,
        borderRadius: 10,
        padding: '12px 14px',
        fontSize: 15,
      }}
    />
  );
}
