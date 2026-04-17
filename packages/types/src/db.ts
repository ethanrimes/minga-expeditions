// Shape of Supabase tables — hand-maintained. Regenerate with `supabase gen types typescript` once the schema stabilizes.

export type ExpeditionCategory =
  | 'hiking'
  | 'cycling'
  | 'running'
  | 'trekking'
  | 'cultural'
  | 'wildlife'
  | 'other';

export type TierLevel = 'bronze' | 'silver' | 'gold' | 'diamond';

export type ActivityType = 'hike' | 'ride' | 'run' | 'walk';

export interface DbProfile {
  id: string; // uuid — matches auth.users.id
  username: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
  home_country: string | null;
  total_distance_km: number;
  total_elevation_m: number;
  tier: TierLevel;
  created_at: string;
  updated_at: string;
}

export interface DbExpedition {
  id: string;
  author_id: string;
  title: string;
  description: string;
  category: ExpeditionCategory;
  location_name: string;
  region: string | null;
  country: string;
  start_lat: number | null;
  start_lng: number | null;
  distance_km: number | null;
  elevation_gain_m: number | null;
  difficulty: 1 | 2 | 3 | 4 | 5;
  price_cents: number; // 0 = free, non-zero for paid listings
  currency: string; // 'COP' | 'USD' ...
  cover_photo_url: string | null;
  is_official: boolean; // true for Minga-published expeditions
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface DbExpeditionPhoto {
  id: string;
  expedition_id: string;
  url: string;
  caption: string | null;
  order_index: number;
  attribution_id: string | null;
  created_at: string;
}

export interface DbPhotoAttribution {
  id: string;
  photographer_name: string;
  source_url: string;
  license: string;
  license_url: string | null;
  notes: string | null;
}

export interface DbActivity {
  id: string;
  user_id: string;
  expedition_id: string | null;
  activity_type: ActivityType;
  title: string;
  started_at: string;
  ended_at: string | null;
  distance_km: number;
  elevation_gain_m: number;
  duration_seconds: number;
  avg_speed_kmh: number | null;
  cover_photo_url: string | null;
  notes: string | null;
  created_at: string;
}

export interface DbActivityTrackPoint {
  id: string;
  activity_id: string;
  recorded_at: string;
  lat: number;
  lng: number;
  altitude_m: number | null;
  speed_ms: number | null;
  sequence: number;
}

export interface DbComment {
  id: string;
  expedition_id: string;
  author_id: string;
  parent_id: string | null; // threaded replies
  body: string;
  created_at: string;
}

export interface DbLike {
  user_id: string;
  expedition_id: string;
  created_at: string;
}

export interface DbRating {
  user_id: string;
  expedition_id: string;
  stars: 1 | 2 | 3 | 4 | 5;
  review: string | null;
  created_at: string;
}

export interface DbActivityComment {
  id: string;
  activity_id: string;
  author_id: string;
  body: string;
  created_at: string;
}

export interface DbActivityRating {
  user_id: string;
  activity_id: string;
  stars: 1 | 2 | 3 | 4 | 5;
  review: string | null;
  created_at: string;
}
