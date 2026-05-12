import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, X } from 'lucide-react';
import { useTheme } from '@minga/theme';
import { useT } from '@minga/i18n';

interface Props {
  message: string;
  onClose: () => void;
}

export function SignInRequiredModal({ message, onClose }: Props) {
  const { theme } = useTheme();
  const { t } = useT();
  const nav = useNavigate();

  const goSignIn = () => {
    onClose();
    nav('/auth');
  };

  return (
    <div
      role="dialog"
      aria-modal
      data-testid="sign-in-required-modal"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.55)',
        zIndex: 200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 'min(420px, 100%)',
          background: theme.background,
          color: theme.text,
          borderRadius: 20,
          padding: 24,
          boxShadow: '0 30px 70px rgba(0,0,0,0.4)',
          position: 'relative',
        }}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          style={{
            position: 'absolute',
            top: 12,
            right: 12,
            background: 'transparent',
            border: 0,
            color: theme.textMuted,
            cursor: 'pointer',
            padding: 4,
          }}
        >
          <X size={20} />
        </button>

        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 44,
            height: 44,
            borderRadius: 999,
            background: theme.primaryMuted,
            color: theme.primary,
            marginBottom: 12,
          }}
        >
          <LogIn size={22} strokeWidth={2.2} />
        </div>
        <h2 style={{ margin: '0 0 6px', fontSize: 20, fontWeight: 800 }}>
          {t('auth.signInRequiredTitle')}
        </h2>
        <p style={{ color: theme.textMuted, margin: '0 0 20px', fontSize: 15, lineHeight: 1.5 }}>
          {message}
        </p>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: `1px solid ${theme.border}`,
              color: theme.text,
              borderRadius: 999,
              padding: '10px 18px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            {t('auth.signInRequiredDismiss')}
          </button>
          <button
            data-testid="sign-in-required-cta"
            onClick={goSignIn}
            style={{
              background: theme.primary,
              color: theme.onPrimary,
              border: 0,
              borderRadius: 999,
              padding: '10px 22px',
              fontWeight: 800,
              cursor: 'pointer',
            }}
          >
            {t('auth.signInRequiredCta')}
          </button>
        </div>
      </div>
    </div>
  );
}

export function isSignInRequiredError(e: unknown): boolean {
  const msg = (e instanceof Error ? e.message : String(e ?? '')).toLowerCase();
  return msg.includes('sign in');
}
