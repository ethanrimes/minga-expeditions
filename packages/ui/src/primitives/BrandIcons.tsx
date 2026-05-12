import React from 'react';
import Svg, { Circle, Path } from 'react-native-svg';

// Minimal brand glyphs for providers lucide-react-native doesn't ship —
// today that's just Google. Facebook and Instagram are pulled from
// lucide-react-native via the regular Icon registry. Both web and RN
// share the same visual treatment via SocialRow.

export interface BrandIconProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
}

export function GoogleGlyph({ size = 18, color = '#4285F4', strokeWidth = 2 }: BrandIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle
        cx={12}
        cy={12}
        r={9}
        stroke={color}
        strokeWidth={strokeWidth}
      />
      <Path
        d="M12 8v4h4"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M16 14a4 4 0 1 1-1.2-3.5"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
