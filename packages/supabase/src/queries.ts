import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  AppRole,
  DbActivity,
  DbActivityComment,
  DbActivityPhoto,
  DbActivityRating,
  DbActivityTrackPoint,
  DbCategory,
  DbComment,
  DbExpedition,
  DbOrder,
  DbProfile,
  DbVendorProposal,
  ExpeditionWithAuthor,
  CommentWithAuthor,
  OrderStatus,
  ProposalStatus,
  TerrainTag,
  TrackPoint,
  VendorType,
} from '@minga/types';

// Columns that recur in joins — keep them in one place to keep queries terse.
const EXPEDITION_SELECT = `
  *,
  author:profiles!expeditions_author_id_fkey (id, username, display_name, avatar_url, tier),
  photos:expedition_photos (
    *,
    attribution:photo_attributions (*)
  )
`;

export async function fetchFeedExpeditions(
  client: SupabaseClient,
  opts: { limit?: number; category?: string | null } = {},
): Promise<ExpeditionWithAuthor[]> {
  const limit = opts.limit ?? 20;
  let q = client
    .from('expeditions')
    .select(EXPEDITION_SELECT)
    .eq('is_published', true)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (opts.category && opts.category !== 'all') q = q.eq('category', opts.category);

  const { data, error } = await q;
  if (error) throw error;
  const expeditions = (data ?? []) as unknown as ExpeditionWithAuthor[];
  await enrichAggregates(client, expeditions);
  return expeditions;
}

export async function fetchExpeditionById(
  client: SupabaseClient,
  id: string,
): Promise<ExpeditionWithAuthor | null> {
  const { data, error } = await client.from('expeditions').select(EXPEDITION_SELECT).eq('id', id).maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const enriched = data as unknown as ExpeditionWithAuthor;
  await enrichAggregates(client, [enriched]);
  return enriched;
}

// Aggregate counts aren't free in Supabase without views — do parallel head:true counts per row.
// For larger scale, replace with a Postgres view or materialized view.
async function enrichAggregates(client: SupabaseClient, rows: ExpeditionWithAuthor[]): Promise<void> {
  await Promise.all(
    rows.map(async (row) => {
      const [likes, comments, ratings] = await Promise.all([
        client.from('likes').select('*', { count: 'exact', head: true }).eq('expedition_id', row.id),
        client.from('comments').select('*', { count: 'exact', head: true }).eq('expedition_id', row.id),
        client.from('ratings').select('stars').eq('expedition_id', row.id),
      ]);
      row.likes_count = likes.count ?? 0;
      row.comments_count = comments.count ?? 0;
      const stars = (ratings.data as { stars: number }[] | null) ?? [];
      row.avg_rating = stars.length ? stars.reduce((s, r) => s + r.stars, 0) / stars.length : null;
    }),
  );
}

export async function fetchComments(client: SupabaseClient, expeditionId: string): Promise<CommentWithAuthor[]> {
  const { data, error } = await client
    .from('comments')
    .select('*, author:profiles!comments_author_id_fkey (id, username, display_name, avatar_url, tier)')
    .eq('expedition_id', expeditionId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  const flat = (data ?? []) as CommentWithAuthor[];
  // Thread: collect roots, nest replies one level deep (Giovanni wants thread-style, shallow nesting is enough for the PoC).
  const byId = new Map<string, CommentWithAuthor>();
  const roots: CommentWithAuthor[] = [];
  for (const c of flat) {
    c.replies = [];
    byId.set(c.id, c);
  }
  for (const c of flat) {
    if (c.parent_id && byId.has(c.parent_id)) byId.get(c.parent_id)!.replies!.push(c);
    else roots.push(c);
  }
  return roots;
}

export async function postComment(
  client: SupabaseClient,
  input: { expedition_id: string; body: string; parent_id?: string | null },
): Promise<DbComment> {
  const { data: user } = await client.auth.getUser();
  if (!user.user) throw new Error('Sign in to comment');
  const { data, error } = await client
    .from('comments')
    .insert({
      expedition_id: input.expedition_id,
      body: input.body,
      parent_id: input.parent_id ?? null,
      author_id: user.user.id,
    })
    .select('*')
    .single();
  if (error) throw error;
  return data as DbComment;
}

export async function toggleLike(client: SupabaseClient, expeditionId: string): Promise<boolean> {
  const { data: user } = await client.auth.getUser();
  if (!user.user) throw new Error('Sign in to like');
  const existing = await client
    .from('likes')
    .select('user_id')
    .eq('expedition_id', expeditionId)
    .eq('user_id', user.user.id)
    .maybeSingle();
  if (existing.data) {
    const { error } = await client.from('likes').delete().eq('expedition_id', expeditionId).eq('user_id', user.user.id);
    if (error) throw error;
    return false;
  }
  const { error } = await client.from('likes').insert({ expedition_id: expeditionId, user_id: user.user.id });
  if (error) throw error;
  return true;
}

export async function rateExpedition(
  client: SupabaseClient,
  input: { expedition_id: string; stars: 1 | 2 | 3 | 4 | 5; review?: string },
): Promise<void> {
  const { data: user } = await client.auth.getUser();
  if (!user.user) throw new Error('Sign in to rate');
  const { error } = await client
    .from('ratings')
    .upsert({
      expedition_id: input.expedition_id,
      user_id: user.user.id,
      stars: input.stars,
      review: input.review ?? null,
    });
  if (error) throw error;
}

export async function fetchProfile(client: SupabaseClient, userId: string): Promise<DbProfile | null> {
  const { data, error } = await client.from('profiles').select('*').eq('id', userId).maybeSingle();
  if (error) throw error;
  return (data as DbProfile | null) ?? null;
}

export async function fetchMyActivities(client: SupabaseClient): Promise<DbActivity[]> {
  const { data: user } = await client.auth.getUser();
  if (!user.user) return [];
  const { data, error } = await client
    .from('activities')
    .select('*')
    .eq('user_id', user.user.id)
    .order('started_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as DbActivity[];
}

export async function saveActivity(
  client: SupabaseClient,
  input: {
    title: string;
    activity_type: DbActivity['activity_type'];
    expedition_id?: string | null;
    is_independent?: boolean;
    terrain_tags?: TerrainTag[];
    started_at: string;
    ended_at: string;
    distance_km: number;
    elevation_gain_m: number;
    duration_seconds: number;
    notes?: string | null;
    track: TrackPoint[];
  },
): Promise<DbActivity> {
  const { data: user } = await client.auth.getUser();
  if (!user.user) throw new Error('Sign in to save activity');

  const avgSpeed = input.duration_seconds > 0 ? input.distance_km / (input.duration_seconds / 3600) : 0;

  const { data: activity, error } = await client
    .from('activities')
    .insert({
      user_id: user.user.id,
      expedition_id: input.expedition_id ?? null,
      is_independent: input.is_independent ?? input.expedition_id == null,
      terrain_tags: input.terrain_tags ?? [],
      activity_type: input.activity_type,
      title: input.title,
      started_at: input.started_at,
      ended_at: input.ended_at,
      distance_km: input.distance_km,
      elevation_gain_m: input.elevation_gain_m,
      duration_seconds: input.duration_seconds,
      avg_speed_kmh: avgSpeed,
      notes: input.notes ?? null,
    })
    .select('*')
    .single();
  if (error) throw error;

  if (input.track.length > 0) {
    const rows: Omit<DbActivityTrackPoint, 'id'>[] = input.track.map((p, i) => ({
      activity_id: (activity as DbActivity).id,
      recorded_at: new Date(p.timestamp).toISOString(),
      lat: p.lat,
      lng: p.lng,
      altitude_m: p.altitude_m,
      speed_ms: p.speed_ms,
      sequence: i,
    }));
    const { error: trackError } = await client.from('activity_tracks').insert(rows);
    if (trackError) throw trackError;
  }
  return activity as DbActivity;
}

// --- activity detail ------------------------------------------------------

export async function fetchActivityById(
  client: SupabaseClient,
  id: string,
): Promise<DbActivity | null> {
  const { data, error } = await client.from('activities').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return (data as DbActivity | null) ?? null;
}

export async function fetchActivityTrack(
  client: SupabaseClient,
  activityId: string,
): Promise<[number, number][]> {
  const { data, error } = await client
    .from('activity_tracks')
    .select('lat, lng, sequence')
    .eq('activity_id', activityId)
    .order('sequence', { ascending: true });
  if (error) throw error;
  return ((data as { lat: number; lng: number }[] | null) ?? []).map((r) => [r.lng, r.lat]);
}

export async function fetchActivityComments(
  client: SupabaseClient,
  activityId: string,
): Promise<DbActivityComment[]> {
  const { data, error } = await client
    .from('activity_comments')
    .select('*')
    .eq('activity_id', activityId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []) as DbActivityComment[];
}

export async function postActivityComment(
  client: SupabaseClient,
  input: { activity_id: string; body: string },
): Promise<DbActivityComment> {
  const { data: user } = await client.auth.getUser();
  if (!user.user) throw new Error('Sign in to comment');
  const { data, error } = await client
    .from('activity_comments')
    .insert({ activity_id: input.activity_id, body: input.body, author_id: user.user.id })
    .select('*')
    .single();
  if (error) throw error;
  return data as DbActivityComment;
}

export async function deleteActivityComment(client: SupabaseClient, id: string): Promise<void> {
  const { error } = await client.from('activity_comments').delete().eq('id', id);
  if (error) throw error;
}

export async function fetchActivityRating(
  client: SupabaseClient,
  activityId: string,
): Promise<DbActivityRating | null> {
  const { data: user } = await client.auth.getUser();
  if (!user.user) return null;
  const { data, error } = await client
    .from('activity_ratings')
    .select('*')
    .eq('activity_id', activityId)
    .eq('user_id', user.user.id)
    .maybeSingle();
  if (error) throw error;
  return (data as DbActivityRating | null) ?? null;
}

export async function upsertActivityRating(
  client: SupabaseClient,
  input: { activity_id: string; stars: 1 | 2 | 3 | 4 | 5; review?: string | null },
): Promise<void> {
  const { data: user } = await client.auth.getUser();
  if (!user.user) throw new Error('Sign in to rate');
  const { error } = await client.from('activity_ratings').upsert({
    activity_id: input.activity_id,
    user_id: user.user.id,
    stars: input.stars,
    review: input.review ?? null,
  });
  if (error) throw error;
}

// --------------------------------------------------------------------------

export async function fetchExpeditionCategories(
  client: SupabaseClient,
): Promise<{ category: DbExpedition['category']; count: number }[]> {
  const { data, error } = await client.from('expeditions').select('category').eq('is_published', true);
  if (error) throw error;
  const counts = new Map<DbExpedition['category'], number>();
  for (const r of (data ?? []) as { category: DbExpedition['category'] }[]) {
    counts.set(r.category, (counts.get(r.category) ?? 0) + 1);
  }
  return Array.from(counts.entries()).map(([category, count]) => ({ category, count }));
}

// =============================================================================
// Categories — managed via the admin web app, read by everyone.
// =============================================================================

export async function fetchCategories(
  client: SupabaseClient,
  opts: { activeOnly?: boolean } = {},
): Promise<DbCategory[]> {
  let q = client.from('categories').select('*').order('sort_order', { ascending: true });
  if (opts.activeOnly) q = q.eq('is_active', true);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as DbCategory[];
}

export async function fetchCategoryById(
  client: SupabaseClient,
  id: string,
): Promise<DbCategory | null> {
  const { data, error } = await client.from('categories').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return (data as DbCategory | null) ?? null;
}

export type CategoryInput = {
  slug: string;
  name_en: string;
  name_es: string;
  icon_name?: string | null;
  sort_order?: number;
  is_active?: boolean;
};

export async function createCategory(
  client: SupabaseClient,
  input: CategoryInput,
): Promise<DbCategory> {
  const { data, error } = await client.from('categories').insert(input).select('*').single();
  if (error) throw error;
  return data as DbCategory;
}

export async function updateCategory(
  client: SupabaseClient,
  id: string,
  input: Partial<CategoryInput>,
): Promise<DbCategory> {
  const { data, error } = await client.from('categories').update(input).eq('id', id).select('*').single();
  if (error) throw error;
  return data as DbCategory;
}

export async function deleteCategory(client: SupabaseClient, id: string): Promise<void> {
  // The FK on expeditions.category_id is ON DELETE RESTRICT, so this throws if
  // any expedition still references the category. Callers should reassign or
  // soft-disable (is_active=false) instead of hard-delete in that case.
  const { error } = await client.from('categories').delete().eq('id', id);
  if (error) throw error;
}

// =============================================================================
// Expeditions admin CRUD — separate from the public feed reads above so that
// admin tools see drafts/unpublished rows and edit any author's row.
// =============================================================================

export type ExpeditionInput = {
  title: string;
  description: string;
  category_id: string;
  author_id: string;
  location_name: string;
  region?: string | null;
  country?: string;
  start_lat?: number | null;
  start_lng?: number | null;
  distance_km?: number | null;
  elevation_gain_m?: number | null;
  difficulty?: 1 | 2 | 3 | 4 | 5;
  price_cents?: number;
  currency?: string;
  cover_photo_url?: string | null;
  is_official?: boolean;
  is_published?: boolean;
};

export async function adminListExpeditions(
  client: SupabaseClient,
  opts: { search?: string; categoryId?: string | null; limit?: number } = {},
): Promise<DbExpedition[]> {
  let q = client.from('expeditions').select('*').order('created_at', { ascending: false }).limit(opts.limit ?? 100);
  if (opts.categoryId) q = q.eq('category_id', opts.categoryId);
  if (opts.search?.trim()) q = q.ilike('title', `%${opts.search.trim()}%`);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as DbExpedition[];
}

export async function adminGetExpedition(
  client: SupabaseClient,
  id: string,
): Promise<DbExpedition | null> {
  const { data, error } = await client.from('expeditions').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return (data as DbExpedition | null) ?? null;
}

export async function createExpedition(
  client: SupabaseClient,
  input: ExpeditionInput,
): Promise<DbExpedition> {
  const { data, error } = await client.from('expeditions').insert(input).select('*').single();
  if (error) throw error;
  return data as DbExpedition;
}

export async function updateExpedition(
  client: SupabaseClient,
  id: string,
  input: Partial<ExpeditionInput>,
): Promise<DbExpedition> {
  const { data, error } = await client.from('expeditions').update(input).eq('id', id).select('*').single();
  if (error) throw error;
  return data as DbExpedition;
}

export async function deleteExpedition(client: SupabaseClient, id: string): Promise<void> {
  const { error } = await client.from('expeditions').delete().eq('id', id);
  if (error) throw error;
}

// =============================================================================
// Role helpers — used by both clients to gate admin UI.
// =============================================================================

export async function getMyRole(client: SupabaseClient): Promise<AppRole | null> {
  const { data: u } = await client.auth.getUser();
  if (!u.user) return null;
  const { data, error } = await client
    .from('profiles')
    .select('role')
    .eq('id', u.user.id)
    .maybeSingle();
  if (error) throw error;
  return ((data as { role: AppRole } | null)?.role ?? null);
}

export async function isAdmin(client: SupabaseClient): Promise<boolean> {
  return (await getMyRole(client)) === 'admin';
}

// =============================================================================
// Vendor proposals — anonymous submission, admin review.
// =============================================================================

export type VendorProposalInput = {
  vendor_name: string;
  contact_email?: string | null;
  contact_phone?: string | null;
  vendor_type: VendorType;
  region?: string | null;
  title: string;
  description: string;
  pricing_notes?: string | null;
  attachments_url?: string | null;
};

export async function submitVendorProposal(
  client: SupabaseClient,
  input: VendorProposalInput,
): Promise<DbVendorProposal> {
  if (!input.contact_email && !input.contact_phone) {
    throw new Error('At least one contact method (email or phone) is required.');
  }
  const { data, error } = await client
    .from('vendor_proposals')
    .insert(input)
    .select('*')
    .single();
  if (error) throw error;
  return data as DbVendorProposal;
}

export async function listVendorProposals(
  client: SupabaseClient,
  opts: { status?: ProposalStatus | 'all'; type?: VendorType | 'all'; limit?: number } = {},
): Promise<DbVendorProposal[]> {
  let q = client
    .from('vendor_proposals')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(opts.limit ?? 200);
  if (opts.status && opts.status !== 'all') q = q.eq('status', opts.status);
  if (opts.type && opts.type !== 'all') q = q.eq('vendor_type', opts.type);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as DbVendorProposal[];
}

export async function getVendorProposal(
  client: SupabaseClient,
  id: string,
): Promise<DbVendorProposal | null> {
  const { data, error } = await client.from('vendor_proposals').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return (data as DbVendorProposal | null) ?? null;
}

export async function updateVendorProposal(
  client: SupabaseClient,
  id: string,
  patch: { status?: ProposalStatus; admin_notes?: string | null },
): Promise<DbVendorProposal> {
  const { data, error } = await client
    .from('vendor_proposals')
    .update(patch)
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;
  return data as DbVendorProposal;
}

export async function vendorProposalCounts(
  client: SupabaseClient,
): Promise<Record<ProposalStatus, number>> {
  // Single round-trip per status. Cheap because the table is small.
  const statuses: ProposalStatus[] = ['new', 'reviewing', 'accepted', 'rejected', 'archived'];
  const result = { new: 0, reviewing: 0, accepted: 0, rejected: 0, archived: 0 } as Record<
    ProposalStatus,
    number
  >;
  await Promise.all(
    statuses.map(async (s) => {
      const { count } = await client
        .from('vendor_proposals')
        .select('*', { count: 'exact', head: true })
        .eq('status', s);
      result[s] = count ?? 0;
    }),
  );
  return result;
}

// =============================================================================
// Activity photos — uploaded post-stop.
// =============================================================================

export async function fetchActivityPhotos(
  client: SupabaseClient,
  activityId: string,
): Promise<DbActivityPhoto[]> {
  const { data, error } = await client
    .from('activity_photos')
    .select('*')
    .eq('activity_id', activityId)
    .order('order_index', { ascending: true });
  if (error) throw error;
  return (data ?? []) as DbActivityPhoto[];
}

export async function uploadActivityPhoto(
  client: SupabaseClient,
  activityId: string,
  file: File | Blob,
  filename: string,
  meta: { caption?: string | null; taken_at?: string | null; lat?: number | null; lng?: number | null } = {},
): Promise<DbActivityPhoto> {
  const { data: u } = await client.auth.getUser();
  if (!u.user) throw new Error('Sign in to upload photos');

  const path = `${u.user.id}/${activityId}/${Date.now()}-${filename.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
  const { error: upErr } = await client.storage.from('activity-photos').upload(path, file, {
    cacheControl: '31536000',
    upsert: false,
  });
  if (upErr) throw upErr;

  const url = client.storage.from('activity-photos').getPublicUrl(path).data.publicUrl;

  const { data, error } = await client
    .from('activity_photos')
    .insert({
      activity_id: activityId,
      url,
      caption: meta.caption ?? null,
      taken_at: meta.taken_at ?? null,
      lat: meta.lat ?? null,
      lng: meta.lng ?? null,
    })
    .select('*')
    .single();
  if (error) throw error;
  return data as DbActivityPhoto;
}

export async function fetchMyPurchasedExpeditions(
  client: SupabaseClient,
): Promise<{ id: string; title: string }[]> {
  // The "linked to a purchased experience" picker on the start screen lists
  // every expedition the signed-in user has an approved order for.
  const { data: u } = await client.auth.getUser();
  if (!u.user) return [];
  const { data, error } = await client
    .from('orders')
    .select('expedition:expeditions ( id, title )')
    .eq('buyer_profile_id', u.user.id)
    .eq('status', 'approved');
  if (error) throw error;
  const seen = new Set<string>();
  const out: { id: string; title: string }[] = [];
  for (const row of (data ?? []) as { expedition: { id: string; title: string } | null }[]) {
    if (row.expedition && !seen.has(row.expedition.id)) {
      seen.add(row.expedition.id);
      out.push(row.expedition);
    }
  }
  return out;
}

export async function updateActivityMetadata(
  client: SupabaseClient,
  id: string,
  patch: {
    title?: string;
    activity_type?: DbActivity['activity_type'];
    expedition_id?: string | null;
    is_independent?: boolean;
    terrain_tags?: TerrainTag[];
    notes?: string | null;
  },
): Promise<DbActivity> {
  const { data, error } = await client
    .from('activities')
    .update(patch)
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;
  return data as DbActivity;
}

// =============================================================================
// Orders — read-only client helpers. Inserts happen exclusively via Edge
// Functions using the service role.
// =============================================================================

export async function fetchOrderById(client: SupabaseClient, id: string): Promise<DbOrder | null> {
  const { data, error } = await client.from('orders').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return (data as DbOrder | null) ?? null;
}

export async function fetchOrderByReference(
  client: SupabaseClient,
  ref: string,
): Promise<DbOrder | null> {
  const { data, error } = await client
    .from('orders')
    .select('*')
    .eq('wompi_reference', ref)
    .maybeSingle();
  if (error) throw error;
  return (data as DbOrder | null) ?? null;
}

export async function adminListOrders(
  client: SupabaseClient,
  opts: { status?: OrderStatus | 'all'; limit?: number } = {},
): Promise<DbOrder[]> {
  let q = client
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(opts.limit ?? 200);
  if (opts.status && opts.status !== 'all') q = q.eq('status', opts.status);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as DbOrder[];
}

export async function orderCounts(client: SupabaseClient): Promise<Record<OrderStatus, number>> {
  const statuses: OrderStatus[] = ['pending', 'approved', 'declined', 'voided', 'error', 'refunded'];
  const result = { pending: 0, approved: 0, declined: 0, voided: 0, error: 0, refunded: 0 } as Record<
    OrderStatus,
    number
  >;
  await Promise.all(
    statuses.map(async (s) => {
      const { count } = await client
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('status', s);
      result[s] = count ?? 0;
    }),
  );
  return result;
}

// Storage upload helper used by the admin app for cover photos. The bucket is
// created in the roles_and_categories migration.
export async function uploadExpeditionPhoto(
  client: SupabaseClient,
  file: File | Blob,
  filename: string,
): Promise<{ path: string; publicUrl: string }> {
  const path = `${Date.now()}-${filename.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
  const { error } = await client.storage.from('expedition-photos').upload(path, file, {
    cacheControl: '31536000',
    upsert: false,
  });
  if (error) throw error;
  const { data } = client.storage.from('expedition-photos').getPublicUrl(path);
  return { path, publicUrl: data.publicUrl };
}
