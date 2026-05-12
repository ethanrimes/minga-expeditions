// Shape of Supabase tables — hand-maintained. Regenerate with `supabase gen types typescript` once the schema stabilizes.

// `ExpeditionCategory` started as a Postgres enum; the source of truth has
// since moved to the `categories` table (see `DbCategory`). The string union
// is preserved for the legacy `expeditions.category` column and for
// translation-key lookups in mobile UI until the switch is complete.
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

export type TerrainTag =
  | 'mountain'
  | 'flat'
  | 'desert'
  | 'river'
  | 'forest'
  | 'coast'
  | 'urban'
  | 'jungle'
  | 'snow';

export type AppRole = 'user' | 'admin' | 'vendor';

export type VendorType =
  | 'full_experience'
  | 'transportation'
  | 'lodging'
  | 'guide'
  | 'food'
  | 'other';

export type ProposalStatus = 'new' | 'reviewing' | 'accepted' | 'rejected' | 'archived';

export type OrderStatus = 'pending' | 'approved' | 'declined' | 'voided' | 'error' | 'refunded';

export interface DbCategory {
  id: string;
  slug: string;
  name_en: string;
  name_es: string;
  icon_name: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DbProfile {
  id: string; // uuid — matches auth.users.id
  username: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
  home_country: string | null;
  // Optional connected social handle (no leading `@`, lowercased). Constraint
  // lives in supabase/migrations/20260511_000400_profile_instagram.sql.
  instagram_handle: string | null;
  // Added by 20260511000100_profile_phone.sql. National significant number
  // without the country dial code; pair with phone_country_code for E.164.
  phone_country_code: string | null;
  phone_number: string | null;
  // ISO timestamp set by 20260511000200_phone_verifications.sql after a
  // successful WhatsApp OTP. null means the number on file is unverified.
  phone_verified_at: string | null;
  total_distance_km: number;
  total_elevation_m: number;
  tier: TierLevel;
  role: AppRole;
  created_at: string;
  updated_at: string;
}

export interface DbExpedition {
  id: string;
  author_id: string;
  title: string;
  description: string;
  category: ExpeditionCategory;
  category_id: string;
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
  terrain_tags: TerrainTag[];
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
  terrain_tags: TerrainTag[];
  is_independent: boolean;
  created_at: string;
}

export interface DbActivityPhoto {
  id: string;
  activity_id: string;
  url: string;
  caption: string | null;
  taken_at: string | null;
  lat: number | null;
  lng: number | null;
  order_index: number;
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

export interface DbGuestContact {
  id: string;
  email: string | null;
  phone: string | null;
  display_name: string | null;
  claimed_by_profile_id: string | null;
  claimed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbOrder {
  id: string;
  expedition_id: string;
  salida_id: string | null;
  buyer_profile_id: string | null;
  buyer_guest_contact_id: string | null;
  amount_cents: number;
  currency: string;
  status: OrderStatus;
  wompi_reference: string;
  wompi_transaction_id: string | null;
  wompi_payment_method_type: string | null;
  wompi_status_message: string | null;
  metadata: Record<string, unknown> | null;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbExpeditionSalida {
  id: string;
  expedition_id: string;
  starts_at: string;
  ends_at: string | null;
  timezone: string;
  capacity: number | null;
  seats_taken: number;
  // null means "inherit template price". Resolve via priceForSalida() in @minga/logic.
  price_cents: number | null;
  currency: string | null;
  notes: string | null;
  is_published: boolean;
  // Recurrence linkage — see migration 20260512000200_salida_series.
  series_id: string | null;
  overrides_series: boolean;
  provider_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbParticipation {
  id: string;
  user_id: string;
  salida_id: string;
  expedition_id: string;
  order_id: string | null;
  tier_at_signup: TierLevel;
  attended_at: string | null;
  completion_acknowledged_at: string | null;
  organizer_review_stars: 1 | 2 | 3 | 4 | 5 | null;
  organizer_review_body: string | null;
  organizer_reviewed_at: string | null;
  organizer_reviewer_id: string | null;
  ack_distance_km: number | null;
  ack_elevation_m: number | null;
  created_at: string;
  updated_at: string;
}

export type CommChannel = 'email' | 'whatsapp';
export type CommLocale = 'en' | 'es';

export interface CommPlaceholder {
  key: string;
  label: string;
  source?: string;
  example?: string;
  format?: string;
}

export interface DbCommEventType {
  key: string;
  description: string;
  placeholders: CommPlaceholder[];
  created_at: string;
}

export interface DbCommTemplate {
  id: string;
  event_key: string;
  name: string;
  locale: CommLocale;
  channel: CommChannel;
  subject: string | null;
  body: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// On-demand outbound (a.k.a. "broadcast") templates. Distinct from
// `comm_templates` which are event-triggered: these are composed once and
// fired manually from the admin (promos, announcements, new-trip launches).
export type CommBroadcastCategory =
  | 'announcement'
  | 'promotion'
  | 'new_trip'
  | 'reminder'
  | 'other';

export interface DbCommBroadcastTemplate {
  id: string;
  name: string;
  category: CommBroadcastCategory;
  channel: CommChannel;
  locale: CommLocale;
  subject: string | null;
  body: string;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface DbProvider {
  id: string;
  profile_id: string | null;
  proposal_id: string | null;
  display_name: string;
  vendor_type: VendorType | null;
  region: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  whatsapp: string | null;
  website: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}


export interface DbVendorProposal {
  id: string;
  vendor_name: string;
  contact_email: string | null;
  contact_phone: string | null;
  vendor_type: VendorType;
  region: string | null;
  title: string;
  description: string;
  pricing_notes: string | null;
  attachments_url: string | null;
  status: ProposalStatus;
  admin_notes: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  submitter_profile_id: string | null;
  created_at: string;
  updated_at: string;
}
