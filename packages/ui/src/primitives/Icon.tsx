import React from 'react';
import {
  Activity,
  Bike,
  CircleDollarSign,
  Compass,
  Drama,
  Footprints,
  Map as MapIcon,
  MapPin,
  Medal,
  MessageCircle,
  Mountain,
  MountainSnow,
  PersonStanding,
  Sparkles,
  Leaf,
  Settings as SettingsIcon,
  Star,
  User as UserIcon,
  Heart,
  ChevronLeft,
  ChevronRight,
  X,
  Check,
  Image as ImageIcon,
  Calendar,
  Timer,
  Gauge,
  Flag,
} from 'lucide-react-native';

// Name union — keep it tight so callers can't typo a nonexistent icon, and so
// we only pull icons we actually ship. Add a new entry here + the import above
// when the UI needs more.
export type IconName =
  | 'activity'
  | 'bike'
  | 'compass'
  | 'drama'
  | 'footprints'
  | 'map'
  | 'map-pin'
  | 'medal'
  | 'message'
  | 'mountain'
  | 'mountain-snow'
  | 'person'
  | 'sparkles'
  | 'leaf'
  | 'settings'
  | 'star'
  | 'user'
  | 'heart'
  | 'chevron-left'
  | 'chevron-right'
  | 'x'
  | 'check'
  | 'image'
  | 'calendar'
  | 'timer'
  | 'gauge'
  | 'flag'
  | 'dollar';

const MAP: Record<IconName, React.ComponentType<any>> = {
  activity: Activity,
  bike: Bike,
  compass: Compass,
  drama: Drama,
  footprints: Footprints,
  map: MapIcon,
  'map-pin': MapPin,
  medal: Medal,
  message: MessageCircle,
  mountain: Mountain,
  'mountain-snow': MountainSnow,
  person: PersonStanding,
  sparkles: Sparkles,
  leaf: Leaf,
  settings: SettingsIcon,
  star: Star,
  user: UserIcon,
  heart: Heart,
  'chevron-left': ChevronLeft,
  'chevron-right': ChevronRight,
  x: X,
  check: Check,
  image: ImageIcon,
  calendar: Calendar,
  timer: Timer,
  gauge: Gauge,
  flag: Flag,
  dollar: CircleDollarSign,
};

export interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
  /** Fill the icon with a solid color (some glyphs look great filled). */
  fill?: string;
}

export function Icon({ name, size = 20, color = 'currentColor', strokeWidth = 2, fill = 'none' }: IconProps) {
  const C = MAP[name];
  if (!C) return null;
  return <C size={size} color={color} strokeWidth={strokeWidth} fill={fill} />;
}
