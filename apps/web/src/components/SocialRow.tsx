import React from 'react';
import { useTheme } from '@minga/theme';

export interface BrandIconProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
}

export interface SocialBrand {
  Icon: React.ComponentType<BrandIconProps>;
  iconColor: string;
  iconBg: string;
}

interface Props {
  brand: SocialBrand;
  label: string;
  value?: string | null;
  linked: boolean;
  primary?: boolean;
  verified?: boolean;
  notLinkedLabel: string;
  primaryAriaLabel?: string;
  children?: React.ReactNode;
}

export function SocialRow({
  brand,
  label,
  value,
  linked,
  primary,
  verified,
  notLinkedLabel,
  primaryAriaLabel,
  children,
}: Props) {
  const { theme } = useTheme();
  const { Icon } = brand;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 999,
            background: brand.iconBg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Icon size={18} color={brand.iconColor} strokeWidth={2.2} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ color: theme.text, fontWeight: 700, fontSize: 15 }}>{label}</span>
            {primary ? (
              <span
                aria-label={primaryAriaLabel}
                title={primaryAriaLabel}
                style={{ color: theme.accent, fontSize: 15, lineHeight: 1 }}
              >
                ★
              </span>
            ) : null}
            {verified ? (
              <span
                style={{
                  background: theme.success ?? '#10b981',
                  color: '#fff',
                  fontSize: 10,
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: 999,
                  letterSpacing: 0.3,
                }}
              >
                ✓ VERIFIED
              </span>
            ) : null}
          </div>
          <div
            style={{
              color: linked ? theme.text : theme.textMuted,
              fontSize: 13,
              marginTop: 2,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {value || notLinkedLabel}
          </div>
        </div>
      </div>
      {children ? <div style={{ paddingLeft: 54 }}>{children}</div> : null}
    </div>
  );
}
