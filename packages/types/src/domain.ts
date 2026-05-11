import type {
  DbExpedition,
  DbExpeditionPhoto,
  DbExpeditionSalida,
  DbPhotoAttribution,
  DbProfile,
  DbComment,
  DbActivity,
  TierLevel,
} from './db';

export interface ExpeditionWithAuthor extends DbExpedition {
  author: Pick<DbProfile, 'id' | 'username' | 'display_name' | 'avatar_url' | 'tier'>;
  photos: (DbExpeditionPhoto & { attribution: DbPhotoAttribution | null })[];
  likes_count: number;
  comments_count: number;
  avg_rating: number | null;
  // Next upcoming published salida, if any. Populated by feed/detail queries
  // so the UI can show "Next departure: …" without an extra round-trip.
  next_salida: DbExpeditionSalida | null;
}

export interface SalidaWithExpedition extends DbExpeditionSalida {
  expedition: Pick<
    DbExpedition,
    | 'id'
    | 'title'
    | 'category'
    | 'category_id'
    | 'location_name'
    | 'region'
    | 'country'
    | 'cover_photo_url'
    | 'difficulty'
    | 'price_cents'
    | 'currency'
    | 'is_official'
    | 'is_published'
  >;
}

export interface CommentWithAuthor extends DbComment {
  author: Pick<DbProfile, 'id' | 'username' | 'display_name' | 'avatar_url' | 'tier'>;
  replies?: CommentWithAuthor[];
}

export interface ActivitySummary extends DbActivity {
  pace_label: string;
  tier_snapshot: TierLevel;
}

export interface TrackPoint {
  lat: number;
  lng: number;
  altitude_m: number | null;
  timestamp: number; // epoch ms
  speed_ms: number | null;
}

export type ThemeName = 'livehappy' | 'minga-green' | 'midnight';
