import React from 'react';
import { Image, Text, View } from 'react-native';
import { useTheme, radii, fontSizes, fontWeights } from '@minga/theme';

export function Avatar({
  uri,
  name,
  size = 40,
}: {
  uri?: string | null;
  name?: string | null;
  size?: number;
}) {
  const { theme } = useTheme();
  const initials = (name ?? '?')
    .split(' ')
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={{ width: size, height: size, borderRadius: radii.pill, backgroundColor: theme.surfaceAlt }}
      />
    );
  }

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: radii.pill,
        backgroundColor: theme.primaryMuted,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text style={{ color: theme.primary, fontWeight: fontWeights.bold, fontSize: fontSizes.sm }}>
        {initials}
      </Text>
    </View>
  );
}
