import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useTheme, spacing, fontSizes } from '@minga/theme';

export function StarRating({
  value,
  onChange,
  size = fontSizes.lg,
}: {
  value: number;
  onChange?: (stars: 1 | 2 | 3 | 4 | 5) => void;
  size?: number;
}) {
  const { theme } = useTheme();
  const stars = [1, 2, 3, 4, 5] as const;
  return (
    <View style={{ flexDirection: 'row', gap: spacing.xxs }}>
      {stars.map((n) => {
        const filled = value >= n - 0.25;
        const half = !filled && value >= n - 0.75;
        const char = filled ? '★' : half ? '★' : '☆';
        const color = filled || half ? theme.accent : theme.textMuted;
        const node = (
          <Text style={{ color, fontSize: size }}>{char}</Text>
        );
        if (!onChange) return <View key={n}>{node}</View>;
        return (
          <Pressable key={n} onPress={() => onChange(n)}>
            {node}
          </Pressable>
        );
      })}
    </View>
  );
}
