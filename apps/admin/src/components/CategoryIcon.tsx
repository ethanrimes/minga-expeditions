// Mirrors the icon name → component map in `packages/ui/src/primitives/Icon.tsx`
// (which uses lucide-react-native for the mobile/user UI). Admin runs on the
// web, so we use lucide-react with the same set of names the CategoryForm
// dropdown offers — change this map only alongside the form's ICON_OPTIONS.

import type { LucideIcon } from 'lucide-react';
import {
  Bike,
  Compass,
  Drama,
  Flag,
  Footprints,
  Leaf,
  Map as MapIcon,
  MapPin,
  Medal,
  Mountain,
  MountainSnow,
  Sparkles,
  Star,
} from 'lucide-react';

const MAP: Record<string, LucideIcon> = {
  mountain: Mountain,
  'mountain-snow': MountainSnow,
  bike: Bike,
  footprints: Footprints,
  compass: Compass,
  leaf: Leaf,
  sparkles: Sparkles,
  drama: Drama,
  medal: Medal,
  flag: Flag,
  map: MapIcon,
  'map-pin': MapPin,
  star: Star,
};

interface Props {
  name: string | null | undefined;
  size?: number;
  className?: string;
}

export function CategoryIcon({ name, size = 20, className }: Props) {
  if (!name) return null;
  const C = MAP[name];
  if (!C) return null;
  return <C size={size} className={className} aria-hidden="true" />;
}
