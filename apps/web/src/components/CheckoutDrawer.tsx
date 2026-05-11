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
// Top-level flag from Minga: when WhatsApp is on, the booking form collects
// a phone number (required) and the post-payment webhook fires a WhatsApp
// utility message. Each WA utility message costs ~$0.008 in Colombia, so
// turning this off is the cheap-default. Email is always collected.
const WHATSAPP_ENABLED = env.VITE_WHATSAPP_ENABLED === 'true';

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
  // Wompi requires phoneNumber + phoneNumberPrefix as SEPARATE fields when
  // either is provided. Passing a combined string like "+573001234567" as
  // phoneNumber alone throws "phoneNumberPrefix obligatorio" on construct.
  customerData?: {
    email?: string;
    fullName?: string;
    phoneNumber?: string;
    phoneNumberPrefix?: string;
  };
}

// Split a user-entered phone like "+57 300 123 4567" into Wompi's expected
// shape: { phoneNumberPrefix: "+57", phoneNumber: "3001234567" }.
// If the input doesn't start with "+" + 1–3 digits we return undefined so
// the caller can omit both fields and let Wompi prompt the user.
function splitPhone(raw: string): { phoneNumber: string; phoneNumberPrefix: string } | undefined {
  const trimmed = raw.trim();
  if (!trimmed) return undefined;
  const m = trimmed.match(/^\+(\d{1,3})[\s-]?(.+)$/);
  if (!m) return undefined;
  const digits = m[2].replace(/\D/g, '');
  if (!digits) return undefined;
  return { phoneNumberPrefix: `+${m[1]}`, phoneNumber: digits };
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
  // Tracks whether the email field was pre-filled from the signed-in user's
  // auth session. We hide the input in that case but keep the value so the
  // submit handler still has it. If null, the user is a guest.
  const [signedInEmail, setSignedInEmail] = useState<string | null>(null);
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Pre-fill from the signed-in session: skip asking for contact info the
  // server already knows. For now we pull email + name from auth.users;
  // phone pre-fill from profile.phone_e164 will land with the migration.
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const { data } = await supabase.auth.getSession();
      if (cancelled) return;
      const user = data.session?.user;
      const userEmail = user?.email?.trim() || null;
      const userMeta = user?.user_metadata as Record<string, unknown> | undefined;
      const userName =
        (typeof userMeta?.full_name === 'string' ? userMeta.full_name : null) ??
        (typeof userMeta?.name === 'string' ? userMeta.name : null);
      if (userEmail) {
        setSignedInEmail(userEmail);
        setEmail(userEmail);
      }
      if (userName) setName((current) => current || userName);
    })();
    return () => {
      cancelled = true;
    };
    // Pre-fill runs once on mount only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email.trim()) {
      setError('Email is required.');
      return;
    }
    if (WHATSAPP_ENABLED && !phone.trim()) {
      setError('WhatsApp number is required.');
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

      const phoneFields = splitPhone(phone);
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
          ...(phoneFields ?? {}),
        },
      });

      setMode('redirecting');
      checkout.open(() => {
        // The widget closes either after payment (Wompi navigates the page)
        // or if the user dismisses. Either way we let the redirect take over;
        // if the user dismissed, leave them on the expedition page.
      });
    } catch (err) {
      // Wompi widget throws non-Error values (plain strings / objects),
      // so falling back to String(err) keeps the error visible to the user.
      const msg =
        err && typeof err === 'object' && 'message' in err && (err as { message?: unknown }).message
          ? String((err as { message: unknown }).message)
          : String(err);
      setError(msg);
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
          {signedInEmail ? (
            <div
              style={{
                background: theme.surfaceAlt,
                border: `1px solid ${theme.border}`,
                borderRadius: 10,
                padding: '12px 14px',
                fontSize: 13,
                color: theme.text,
              }}
            >
              <div style={{ color: theme.textMuted, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.3 }}>
                Signed in as
              </div>
              <div style={{ marginTop: 2, fontWeight: 600 }}>{signedInEmail}</div>
            </div>
          ) : (
            <>
              <Field label="Your name" theme={theme}>
                <Input value={name} onChange={setName} theme={theme} placeholder="Optional" />
              </Field>
              <Field label="Email" theme={theme}>
                <Input value={email} onChange={setEmail} type="email" theme={theme} placeholder="you@email.com" />
              </Field>
            </>
          )}
          {WHATSAPP_ENABLED ? (
            <Field label="WhatsApp phone" theme={theme}>
              <Input value={phone} onChange={setPhone} type="tel" theme={theme} placeholder="+57 …" />
            </Field>
          ) : null}

          <p style={{ color: theme.textMuted, fontSize: 12 }}>
            {WHATSAPP_ENABLED
              ? 'We send the booking confirmation to your email and a WhatsApp message with trip details.'
              : 'We send the booking confirmation to your email.'}
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
