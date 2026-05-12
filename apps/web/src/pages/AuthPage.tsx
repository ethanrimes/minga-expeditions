import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@minga/theme';
import { useT } from '@minga/i18n';
import { supabase } from '../supabase';

export function AuthPage() {
  const { theme } = useTheme();
  const { t } = useT();
  const nav = useNavigate();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (mode === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              display_name: displayName.trim() || email.split('@')[0],
              username: username.trim() || email.split('@')[0],
            },
          },
        });
        if (error) throw error;
      }
      nav('/profile');
    } catch (err: any) {
      setError(err?.message ?? t('common.loadError'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ maxWidth: 480, margin: '80px auto', padding: '0 24px' }}>
      <div style={{ color: theme.primary, letterSpacing: 2, fontWeight: 800, fontSize: 14 }}>MINGA</div>
      <h1 style={{ color: theme.text, fontSize: 36, margin: '6px 0 8px 0' }}>
        {mode === 'signin' ? t('auth.welcomeBack') : t('auth.joinTitle')}
      </h1>
      <div style={{ color: theme.textMuted, marginBottom: 24 }}>{t('auth.oauthNote')}</div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 18 }}>
        <OAuthButton
          provider="google"
          label={t('auth.continueGoogle')}
          theme={theme}
          onError={setError}
        />
        <OAuthButton
          provider="facebook"
          label={t('auth.continueFacebook')}
          theme={theme}
          onError={setError}
        />
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          color: theme.textMuted,
          fontSize: 12,
          margin: '4px 0 16px',
        }}
      >
        <div style={{ flex: 1, height: 1, background: theme.border }} />
        {t('auth.orDivider')}
        <div style={{ flex: 1, height: 1, background: theme.border }} />
      </div>

      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {mode === 'signup' ? (
          <>
            <Field label={t('auth.displayName')} value={displayName} onChange={setDisplayName} theme={theme} />
            <Field label={t('auth.username')} value={username} onChange={setUsername} theme={theme} />
          </>
        ) : null}
        <Field label={t('auth.email')} value={email} onChange={setEmail} theme={theme} type="email" />
        <Field label={t('auth.password')} value={password} onChange={setPassword} theme={theme} type="password" />
        {error ? <div style={{ color: theme.danger }}>{error}</div> : null}
        <button
          type="submit"
          disabled={busy}
          style={{
            background: theme.primary,
            color: theme.onPrimary,
            border: 0,
            padding: '14px',
            borderRadius: 999,
            fontWeight: 800,
            fontSize: 16,
            opacity: busy ? 0.7 : 1,
          }}
        >
          {busy ? '…' : mode === 'signin' ? t('auth.signIn') : t('auth.createAccount')}
        </button>
        <button
          type="button"
          onClick={() => setMode((m) => (m === 'signin' ? 'signup' : 'signin'))}
          style={{ background: 'transparent', border: 0, color: theme.primary, fontWeight: 700, padding: 10 }}
        >
          {mode === 'signin' ? t('auth.switchToSignup') : t('auth.switchToSignin')}
        </button>
      </form>
    </div>
  );
}

function OAuthButton({
  provider,
  label,
  theme,
  onError,
}: {
  provider: 'google' | 'facebook';
  label: string;
  theme: any;
  onError: (msg: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  const click = async () => {
    setBusy(true);
    try {
      // Supabase handles the redirect to /auth/v1/callback?... and then back
      // to redirectTo. The provider must be enabled in the Supabase dashboard.
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: `${window.location.origin}/profile` },
      });
      if (error) throw error;
    } catch (e: any) {
      onError(e?.message ?? 'OAuth sign-in failed');
    } finally {
      setBusy(false);
    }
  };
  return (
    <button
      type="button"
      onClick={click}
      disabled={busy}
      style={{
        background: theme.surface,
        color: theme.text,
        border: `1px solid ${theme.border}`,
        borderRadius: 12,
        padding: '12px 16px',
        fontWeight: 700,
        fontSize: 15,
        cursor: busy ? 'wait' : 'pointer',
        opacity: busy ? 0.7 : 1,
      }}
    >
      {label}
    </button>
  );
}

function Field({
  label,
  value,
  onChange,
  theme,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  theme: any;
  type?: string;
}) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span style={{ color: theme.text, fontWeight: 700, fontSize: 14 }}>{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          padding: '12px 14px',
          borderRadius: 12,
          border: `1px solid ${theme.border}`,
          background: theme.surface,
          color: theme.text,
          fontSize: 16,
        }}
      />
    </label>
  );
}
