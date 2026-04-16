import React from 'react';
import { Linking, Pressable, Text } from 'react-native';
import { useTheme, fontSizes } from '@minga/theme';
import type { DbPhotoAttribution } from '@minga/types';

export function PhotoAttribution({ attribution }: { attribution: DbPhotoAttribution | null }) {
  const { theme } = useTheme();
  if (!attribution) return null;

  const handlePress = () => {
    Linking.openURL(attribution.source_url).catch(() => undefined);
  };

  return (
    <Pressable onPress={handlePress}>
      <Text style={{ color: theme.textMuted, fontSize: fontSizes.xs }}>
        Photo © {attribution.photographer_name} · {attribution.license}
      </Text>
    </Pressable>
  );
}
