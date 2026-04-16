import React from 'react';
import { useTheme } from '@minga/theme';
import { useT } from '@minga/i18n';

export function Footer() {
  const { theme } = useTheme();
  const { t } = useT();
  return (
    <footer
      style={{
        borderTop: `1px solid ${theme.border}`,
        background: theme.surface,
        padding: '40px 24px',
        marginTop: 80,
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 32,
          color: theme.textMuted,
          fontSize: 14,
        }}
      >
        <div>
          <div style={{ color: theme.text, fontWeight: 800, fontSize: 18, marginBottom: 8 }}>
            {t('footer.aboutHeading')}
          </div>
          <div>{t('footer.aboutBody')}</div>
        </div>
        <div>
          <div style={{ color: theme.text, fontWeight: 700, marginBottom: 8 }}>{t('footer.exploreHeading')}</div>
          <div>{t('footer.exploreBody')}</div>
        </div>
        <div>
          <div style={{ color: theme.text, fontWeight: 700, marginBottom: 8 }}>{t('footer.pocHeading')}</div>
          <div>{t('footer.pocBody')}</div>
        </div>
      </div>
    </footer>
  );
}
