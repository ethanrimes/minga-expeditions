import React from 'react';
import { Text, View } from 'react-native';
import { useTheme, spacing, fontSizes, fontWeights, radii } from '@minga/theme';
import { Icon, type IconName } from '../primitives/Icon';

// Visual brand colours for the row's icon badge. Keeps the icon recognisable
// regardless of theme — the surrounding card respects the theme tokens.
// Either provide a registered `iconName` (lucide) OR a custom `iconNode`
// (for brand glyphs lucide-react-native doesn't ship).
export interface SocialBrand {
  iconName?: IconName;
  iconNode?: React.ReactNode;
  iconColor: string; // foreground on the badge
  iconBg: string;
}

export interface SocialRowProps {
  brand: SocialBrand;
  label: string;
  // Main value (e.g. email address, phone number, instagram handle). Falls
  // back to a muted "Not linked" line when omitted.
  value?: string | null;
  // True when the user has linked / filled in this channel.
  linked: boolean;
  // True when this is the user's primary login provider. Renders a small
  // star — no explicit "primary" copy, per design.
  primary?: boolean;
  // Optional verified badge (used for WhatsApp). Rendered next to the label.
  verified?: boolean;
  notLinkedLabel: string;
  primaryAriaLabel?: string;
  // Right-aligned trailing slot for compact actions (e.g. a "Connect" button
  // or a "Verify" link). Stacks vertically on narrow screens by default.
  trailing?: React.ReactNode;
  // Renders below the row inline — for the editable field (phone input, IG
  // handle, OTP entry) that the user controls. The row itself stays compact
  // so the list reads as a single list.
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
  trailing,
  children,
}: SocialRowProps) {
  const { theme } = useTheme();
  return (
    <View style={{ gap: spacing.sm }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: radii.pill,
            backgroundColor: brand.iconBg,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {brand.iconNode ? (
            brand.iconNode
          ) : brand.iconName ? (
            <Icon name={brand.iconName} size={18} color={brand.iconColor} strokeWidth={2.2} />
          ) : null}
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs, flexWrap: 'wrap' }}>
            <Text
              style={{
                color: theme.text,
                fontWeight: fontWeights.bold,
                fontSize: fontSizes.md,
              }}
            >
              {label}
            </Text>
            {primary ? (
              <Text
                accessibilityLabel={primaryAriaLabel}
                style={{ color: theme.accent, fontSize: fontSizes.md }}
              >
                ★
              </Text>
            ) : null}
            {verified ? (
              <View
                style={{
                  backgroundColor: theme.success,
                  paddingHorizontal: spacing.xs,
                  paddingVertical: 2,
                  borderRadius: radii.sm,
                }}
              >
                <Text
                  style={{
                    color: '#fff',
                    fontSize: fontSizes.xs,
                    fontWeight: fontWeights.bold,
                  }}
                >
                  ✓
                </Text>
              </View>
            ) : null}
          </View>
          <Text
            numberOfLines={1}
            style={{
              color: linked ? theme.text : theme.textMuted,
              fontSize: fontSizes.sm,
              marginTop: 2,
            }}
          >
            {value || notLinkedLabel}
          </Text>
        </View>
        {trailing ? <View>{trailing}</View> : null}
      </View>
      {children ? <View style={{ paddingLeft: 36 + Number(spacing.md) }}>{children}</View> : null}
    </View>
  );
}
