import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@minga/theme';
import { supabase } from '../supabase';

export function AuthPage() {
  const { theme } = useTheme();
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
      setError(err?.message ?? 'Something went wrong');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ maxWidth: 480, margin: '80px auto', padding: '0 24px' }}>
      <div style={{ color: theme.primary, letterSpacing: 2, fontWeight: 800, fontSize: 14 }}>MINGA</div>
      <h1 style={{ color: theme.text, fontSize: 36, margin: '6px 0 8px 0' }}>
        {mode === 'signin' ? 'Welcome back' : 'Join the expedition'}
      </h1>
      <div style={{ color: theme.textMuted, marginBottom: 24 }}>
        Google & Meta sign-in coming soon — email + password for now.
      </div>

      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {mode === 'signup' ? (
          <>
            <Field label="Display name" value={displayName} onChange={setDisplayName} theme={theme} />
            <Field label="Username" value={username} onChange={setUsername} theme={theme} />
          </>
        ) : null}
        <Field label="Email" value={email} onChange={setEmail} theme={theme} type="email" />
        <Field label="Password" value={password} onChange={setPassword} theme={theme} type="password" />
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
          {busy ? '…' : mode === 'signin' ? 'Sign in' : 'Create account'}
        </button>
        <button
          type="button"
          onClick={() => setMode((m) => (m === 'signin' ? 'signup' : 'signin'))}
          style={{ background: 'transparent', border: 0, color: theme.primary, fontWeight: 700, padding: 10 }}
        >
          {mode === 'signin' ? 'No account? Create one' : 'Already a member? Sign in'}
        </button>
      </form>
    </div>
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
