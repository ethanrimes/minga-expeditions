import React from 'react';
import { useTheme } from '@minga/theme';

export function Footer() {
  const { theme } = useTheme();
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
            Minga Expeditions
          </div>
          <div>Connecting travelers to Colombia's trails, rivers, and pueblos.</div>
        </div>
        <div>
          <div style={{ color: theme.text, fontWeight: 700, marginBottom: 8 }}>Explore</div>
          <div>Hiking · Cycling · Trekking · Wildlife · Cultural</div>
        </div>
        <div>
          <div style={{ color: theme.text, fontWeight: 700, marginBottom: 8 }}>About</div>
          <div>Proof-of-concept build · 2026</div>
        </div>
      </div>
    </footer>
  );
}
