import React from 'react';
import { Text, View } from 'react-native';
import { useTheme, spacing, fontSizes, fontWeights, radii } from '@minga/theme';
import { Icon, type IconName } from '../primitives/Icon';

// Accept an iconName (preferred, renders a Lucide icon in a soft tinted
// circle) or a legacy string/emoji for gradual migration. New callers should
// use iconName; the string form is kept so we don't have to refactor every
// site in one pass.
export function EmptyState({
  title,
  body,
  icon,
  iconName,
}: {
  title: string;
  body?: string;
  icon?: string;
  iconName?: IconName;
}) {
  const { theme } = useTheme();
  return (
    <View style={{ alignItems: 'center', padding: spacing['2xl'], gap: spacing.sm }}>
      {iconName ? (
        <View
          style={{
            width: 64,
            height: 64,
            borderRadius: radii.pill,
            backgroundColor: theme.primaryMuted,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: spacing.xs,
          }}
        >
          <Icon name={iconName} size={30} color={theme.primary} strokeWidth={2} />
        </View>
      ) : icon ? (
        <Text style={{ fontSize: 48 }}>{icon}</Text>
      ) : null}
      <Text style={{ color: theme.text, fontSize: fontSizes.lg, fontWeight: fontWeights.bold, textAlign: 'center' }}>
        {title}
      </Text>
      {body ? (
        <Text style={{ color: theme.textMuted, fontSize: fontSizes.sm, textAlign: 'center' }}>{body}</Text>
      ) : null}
    </View>
  );
}
