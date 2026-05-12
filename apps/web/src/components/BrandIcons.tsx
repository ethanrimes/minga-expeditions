import React from 'react';

// The web build uses lucide-react@1.14.x (a fork) which doesn't ship brand
// glyphs, so we draw the few we need here as inline SVGs. Kept tiny and
// stroke-based to match the rest of the UI; brand colours are applied by
// the caller via the `iconColor` prop on SocialRow.

interface BrandIconProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
}

export function FacebookIcon({ size = 18, color = 'currentColor', strokeWidth = 2 }: BrandIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

export function InstagramIcon({ size = 18, color = 'currentColor', strokeWidth = 2 }: BrandIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

// "G" mark for Google — minimal, recognisable without using the colourful
// official logo (which has license constraints).
export function GoogleIcon({ size = 18, color = 'currentColor', strokeWidth = 2 }: BrandIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v4h4" />
      <path d="M16 14a4 4 0 1 1-1.2-3.5" />
    </svg>
  );
}
