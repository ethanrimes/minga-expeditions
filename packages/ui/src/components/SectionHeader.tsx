import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useTheme, fontSizes, fontWeights, spacing } from '@minga/theme';

export function SectionHeader({
  title,
  action,
  onActionPress,
}: {
  title: string;
  action?: string;
  onActionPress?: () => void;
}) {
  const { theme } = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        marginBottom: spacing.sm,
      }}
    >
      <Text style={{ color: theme.text, fontSize: fontSizes.xl, fontWeight: fontWeights.bold }}>{title}</Text>
      {action ? (
        <Pressable onPress={onActionPress}>
          <Text style={{ color: theme.primary, fontWeight: fontWeights.semibold }}>{action}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
