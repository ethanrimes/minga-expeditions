import React, { useEffect } from 'react';
import { useTheme } from '@minga/theme';
import { useT } from '@minga/i18n';

interface Props {
  open: boolean;
  isGuest: boolean;
  expeditionTitle?: string | null;
  onClose: () => void;
  onSignIn?: () => void;
}

export function PaymentCelebrationModal({ open, isGuest, expeditionTitle, onClose, onSignIn }: Props) {
  const { theme } = useTheme();
  const { t } = useT();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal
      data-testid="payment-celebration-modal"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.55)',
        zIndex: 200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
    >
      <div
        style={{
          width: 'min(460px, 100%)',
          background: theme.background,
          borderRadius: 18,
          padding: 28,
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
          boxShadow: '0 16px 50px rgba(0,0,0,0.35)',
        }}
      >
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 999,
            background: theme.primaryMuted,
            color: theme.primary,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 28,
          }}
          aria-hidden
        >
          🎉
        </div>
        <h2
          data-testid="payment-celebration-title"
          style={{ color: theme.text, fontSize: 24, fontWeight: 800, margin: 0 }}
        >
          {t('order.celebrateTitle')}
        </h2>
        {expeditionTitle ? (
          <div style={{ color: theme.primary, fontSize: 15, fontWeight: 700 }}>{expeditionTitle}</div>
        ) : null}
        <p style={{ color: theme.textMuted, fontSize: 15, lineHeight: 1.5, margin: 0 }}>
          {isGuest ? t('order.celebrateBodyGuest') : t('order.celebrateBody')}
        </p>
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 10,
            marginTop: 8,
            flexWrap: 'wrap',
          }}
        >
          <button
            onClick={onClose}
            data-testid="payment-celebration-dismiss"
            style={{
              background: theme.surfaceAlt,
              color: theme.text,
              border: `1px solid ${theme.border}`,
              borderRadius: 999,
              padding: '12px 20px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            {t('order.celebrateDismiss')}
          </button>
          {isGuest && onSignIn ? (
            <button
              onClick={() => {
                onClose();
                onSignIn();
              }}
              data-testid="payment-celebration-cta"
              style={{
                background: theme.primary,
                color: theme.onPrimary,
                border: 0,
                borderRadius: 999,
                padding: '12px 22px',
                fontWeight: 800,
                cursor: 'pointer',
              }}
            >
              {t('order.celebrateCta')}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
