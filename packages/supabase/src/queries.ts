import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  AppRole,
  CommChannel,
  CommLocale,
  DbActivity,
  DbActivityComment,
  DbActivityPhoto,
  DbActivityRating,
  DbActivityTrackPoint,
  DbCategory,
  DbComment,
  DbCommEventType,
  DbCommTemplate,
  DbExpedition,
  DbExpeditionPhoto,
  DbExpeditionSalida,
  DbOrder,
  DbParticipation,
  DbProfile,
  DbVendorProposal,
  ExpeditionWithAuthor,
  CommentWithAuthor,
  OrderStatus,
  ParticipationWithSalida,
  ProposalStatus,
  SalidaWithExpedition,
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
  await attachNextSalida(client, rows);
}

// One round-trip for the whole page: pull every upcoming published salida for
// the listed expedition IDs, then pick the earliest per expedition in JS.
async function attachNextSalida(client: SupabaseClient, rows: ExpeditionWithAuthor[]): Promise<void> {
  for (const r of rows) r.next_salida = null;
  if (rows.length === 0) return;
  const ids = rows.map((r) => r.id);
  const nowIso = new Date().toISOString();
  const { data, error } = await client
    .from('expedition_salidas')
    .select('*')
    .in('expedition_id', ids)
    .eq('is_published', true)
    .gte('starts_at', nowIso)
    .order('starts_at', { ascending: true });
  if (error) return; // best-effort: missing salidas just means no "next" badge
  const byExpedition = new Map<string, DbExpeditionSalida>();
  for (const s of (data ?? []) as DbExpeditionSalida[]) {
    if (!byExpedition.has(s.expedition_id)) byExpedition.set(s.expedition_id, s);
  }
  for (const r of rows) r.next_salida = byExpedition.get(r.id) ?? null;
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

// Patch fields users can edit on their own profile. RLS on `profiles` already
// gates writes to `auth.uid() = id`, so callers can't escalate by hand-crafting
// a `userId`. We restrict the shape here so we never accidentally let a user
// rewrite tier/role/etc. through this helper.
export type ProfileSelfPatch = {
  display_name?: string;
  bio?: string | null;
  avatar_url?: string | null;
  instagram_handle?: string | null;
};

export async function updateMyProfile(
  client: SupabaseClient,
  patch: ProfileSelfPatch,
): Promise<DbProfile> {
  const { data: u } = await client.auth.getUser();
  if (!u.user) throw new Error('Sign in to update your profile.');
  const clean: ProfileSelfPatch = {};
  if (patch.display_name !== undefined) {
    const trimmed = patch.display_name.trim();
    if (trimmed.length < 1 || trimmed.length > 80) {
      throw new Error('Display name must be 1–80 characters.');
    }
    clean.display_name = trimmed;
  }
  if (patch.bio !== undefined) clean.bio = patch.bio?.trim() || null;
  if (patch.avatar_url !== undefined) clean.avatar_url = patch.avatar_url || null;
  if (patch.instagram_handle !== undefined) {
    const h = (patch.instagram_handle ?? '').replace(/^@+/, '').trim().toLowerCase();
    if (h && !/^[a-z0-9._]{1,30}$/.test(h)) {
      throw new Error('Instagram handle must be 1–30 letters, numbers, dots, or underscores.');
    }
    clean.instagram_handle = h || null;
  }
  const { data, error } = await client
    .from('profiles')
    .update(clean)
    .eq('id', u.user.id)
    .select('*')
    .single();
  if (error) throw error;
  return data as DbProfile;
}

// Upload to the public `avatars` bucket under the caller's folder and return
// the public URL. The caller then persists that URL with `updateMyProfile`.
// The bucket has a 1 MB-ish footprint per user in practice; we don't enforce
// a server-side size limit yet, but a short cache-control means CDN burn is
// minimal even if a user changes it often.
export async function uploadAvatar(
  client: SupabaseClient,
  file: File | Blob,
  filename: string,
): Promise<string> {
  const { data: u } = await client.auth.getUser();
  if (!u.user) throw new Error('Sign in to upload an avatar.');
  const safe = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
  const path = `${u.user.id}/${Date.now()}-${safe}`;
  const { error: upErr } = await client.storage.from('avatars').upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  });
  if (upErr) throw upErr;
  return client.storage.from('avatars').getPublicUrl(path).data.publicUrl;
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
  for (const row of (data ?? []) as unknown as { expedition: { id: string; title: string } | null }[]) {
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

// =============================================================================
// Expedition photo gallery — multi-photo admin management. The user-facing
// detail screen reads via fetchExpeditionById (which already nests photos);
// these helpers power the admin reorder / add / delete UI.
// =============================================================================

export async function adminListExpeditionPhotos(
  client: SupabaseClient,
  expeditionId: string,
): Promise<DbExpeditionPhoto[]> {
  const { data, error } = await client
    .from('expedition_photos')
    .select('*')
    .eq('expedition_id', expeditionId)
    .order('order_index', { ascending: true });
  if (error) throw error;
  return (data ?? []) as DbExpeditionPhoto[];
}

export async function createExpeditionPhoto(
  client: SupabaseClient,
  input: { expedition_id: string; url: string; caption?: string | null; order_index?: number },
): Promise<DbExpeditionPhoto> {
  const { data, error } = await client
    .from('expedition_photos')
    .insert(input)
    .select('*')
    .single();
  if (error) throw error;
  return data as DbExpeditionPhoto;
}

export async function deleteExpeditionPhoto(client: SupabaseClient, id: string): Promise<void> {
  const { error } = await client.from('expedition_photos').delete().eq('id', id);
  if (error) throw error;
}

// Swaps the order_index of two photos so the admin can move one up or down by
// a single position. Done in two writes — fine for a small gallery and keeps
// the RPC surface area to zero.
export async function swapExpeditionPhotoOrder(
  client: SupabaseClient,
  a: { id: string; order_index: number },
  b: { id: string; order_index: number },
): Promise<void> {
  // Two-phase to dodge any unique constraints if one is ever added: park `a`
  // at a sentinel value first, then settle both.
  const sentinel = 99999;
  const r1 = await client.from('expedition_photos').update({ order_index: sentinel }).eq('id', a.id);
  if (r1.error) throw r1.error;
  const r2 = await client.from('expedition_photos').update({ order_index: a.order_index }).eq('id', b.id);
  if (r2.error) throw r2.error;
  const r3 = await client.from('expedition_photos').update({ order_index: b.order_index }).eq('id', a.id);
  if (r3.error) throw r3.error;
}

// Bulk-set order_index from a desired sequence. Used by the admin form's
// drag-style reorder; for now the UI just emits up/down clicks but this
// helper is here for the future drag-and-drop pass.
export async function setExpeditionPhotoOrder(
  client: SupabaseClient,
  expeditionId: string,
  orderedIds: string[],
): Promise<void> {
  await Promise.all(
    orderedIds.map((id, i) =>
      client.from('expedition_photos').update({ order_index: i }).eq('id', id).eq('expedition_id', expeditionId),
    ),
  );
}

// =============================================================================
// Expedition salidas — dated departures for a given template.
//   - fetchSalidasForExpedition: list (used by detail screens)
//   - fetchSalidasInRange      : calendar view feed
//   - admin CRUD               : add / edit / delete a salida
// =============================================================================

const SALIDA_EXPEDITION_SELECT = `
  *,
  expedition:expeditions!expedition_salidas_expedition_id_fkey (
    id, title, category, category_id, location_name, region, country,
    cover_photo_url, difficulty, price_cents, currency, is_official, is_published,
    terrain_tags
  )
`;

export async function fetchSalidasForExpedition(
  client: SupabaseClient,
  expeditionId: string,
  opts: { upcomingOnly?: boolean; includeUnpublished?: boolean } = {},
): Promise<DbExpeditionSalida[]> {
  let q = client
    .from('expedition_salidas')
    .select('*')
    .eq('expedition_id', expeditionId)
    .order('starts_at', { ascending: true });
  if (!opts.includeUnpublished) q = q.eq('is_published', true);
  if (opts.upcomingOnly) q = q.gte('starts_at', new Date().toISOString());
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as DbExpeditionSalida[];
}

export async function fetchSalidaById(
  client: SupabaseClient,
  id: string,
): Promise<DbExpeditionSalida | null> {
  const { data, error } = await client
    .from('expedition_salidas')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return (data as DbExpeditionSalida | null) ?? null;
}

export interface CalendarSalidaFilters {
  // Legacy single-select fields — still supported.
  category?: string | null;       // matches expeditions.category enum
  category_id?: string | null;
  region?: string | null;
  country?: string | null;
  difficulty?: number | null;
  // Price band on the EXPEDITION template's price_cents. Salida-level overrides
  // are not currently filtered (kept simple — most departures inherit template price).
  minPriceCents?: number | null;
  maxPriceCents?: number | null;
  // Only show free or only show paid expeditions. If both true or both false, no filter.
  onlyFree?: boolean;
  onlyPaid?: boolean;

  // Multiselect versions used by the calendar filter modal. Empty array = no filter.
  categoryIds?: string[];
  regions?: string[];
  terrainTags?: string[];
  // Minimum average rating (1–5). Salidas whose expedition has fewer than one
  // rating count as 0.
  minRating?: number | null;
}

export async function fetchSalidasInRange(
  client: SupabaseClient,
  fromIso: string,
  toIso: string,
  filters: CalendarSalidaFilters = {},
): Promise<SalidaWithExpedition[]> {
  // Pull salidas in the window plus the expedition join, then filter expedition
  // fields client-side. We can't apply `eq` to nested columns through PostgREST.
  const { data, error } = await client
    .from('expedition_salidas')
    .select(SALIDA_EXPEDITION_SELECT)
    .eq('is_published', true)
    .gte('starts_at', fromIso)
    .lte('starts_at', toIso)
    .order('starts_at', { ascending: true });
  if (error) throw error;
  const rows = (data ?? []) as unknown as SalidaWithExpedition[];

  // Pre-compute avg ratings per expedition for the rating filter. Skip the
  // round-trip when the caller didn't ask for it.
  if (filters.minRating != null && filters.minRating > 0) {
    const expeditionIds = Array.from(new Set(rows.map((s) => s.expedition?.id).filter(Boolean) as string[]));
    if (expeditionIds.length > 0) {
      const { data: ratings } = await client
        .from('ratings')
        .select('expedition_id, stars')
        .in('expedition_id', expeditionIds);
      const acc = new Map<string, { sum: number; n: number }>();
      for (const r of (ratings ?? []) as { expedition_id: string; stars: number }[]) {
        const cur = acc.get(r.expedition_id) ?? { sum: 0, n: 0 };
        cur.sum += r.stars;
        cur.n += 1;
        acc.set(r.expedition_id, cur);
      }
      for (const s of rows) {
        const a = acc.get(s.expedition?.id ?? '');
        s.expedition.avg_rating = a ? a.sum / a.n : null;
      }
    }
  }

  return rows.filter((s) => {
    const e = s.expedition;
    if (!e || !e.is_published) return false;
    if (filters.category && e.category !== filters.category) return false;
    if (filters.category_id && e.category_id !== filters.category_id) return false;
    if (filters.categoryIds && filters.categoryIds.length > 0 && !filters.categoryIds.includes(e.category_id)) {
      return false;
    }
    if (filters.region && e.region !== filters.region) return false;
    if (filters.regions && filters.regions.length > 0 && (!e.region || !filters.regions.includes(e.region))) {
      return false;
    }
    if (filters.country && e.country !== filters.country) return false;
    if (filters.difficulty != null && e.difficulty !== filters.difficulty) return false;
    if (filters.terrainTags && filters.terrainTags.length > 0) {
      const tags = e.terrain_tags ?? [];
      if (!filters.terrainTags.some((t) => tags.includes(t as never))) return false;
    }

    const effectivePrice = s.price_cents ?? e.price_cents;
    if (filters.minPriceCents != null && effectivePrice < filters.minPriceCents) return false;
    if (filters.maxPriceCents != null && effectivePrice > filters.maxPriceCents) return false;
    if (filters.onlyFree && !filters.onlyPaid && effectivePrice > 0) return false;
    if (filters.onlyPaid && !filters.onlyFree && effectivePrice <= 0) return false;

    if (filters.minRating != null && filters.minRating > 0) {
      const r = e.avg_rating ?? 0;
      if (r < filters.minRating) return false;
    }
    return true;
  });
}

// ---- Admin / author CRUD --------------------------------------------------

export type SalidaInput = {
  expedition_id: string;
  starts_at: string;
  ends_at?: string | null;
  timezone?: string;
  capacity?: number | null;
  seats_taken?: number;
  price_cents?: number | null;
  currency?: string | null;
  notes?: string | null;
  is_published?: boolean;
};

export async function adminListSalidas(
  client: SupabaseClient,
  opts: { expeditionId?: string | null; from?: string | null; limit?: number } = {},
): Promise<DbExpeditionSalida[]> {
  let q = client
    .from('expedition_salidas')
    .select('*')
    .order('starts_at', { ascending: true })
    .limit(opts.limit ?? 500);
  if (opts.expeditionId) q = q.eq('expedition_id', opts.expeditionId);
  if (opts.from) q = q.gte('starts_at', opts.from);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as DbExpeditionSalida[];
}

export async function adminListSalidasInRange(
  client: SupabaseClient,
  fromIso: string,
  toIso: string,
): Promise<SalidaWithExpedition[]> {
  const { data, error } = await client
    .from('expedition_salidas')
    .select(SALIDA_EXPEDITION_SELECT)
    .gte('starts_at', fromIso)
    .lte('starts_at', toIso)
    .order('starts_at', { ascending: true });
  if (error) throw error;
  return ((data ?? []) as unknown) as SalidaWithExpedition[];
}

export async function createSalida(
  client: SupabaseClient,
  input: SalidaInput,
): Promise<DbExpeditionSalida> {
  const { data, error } = await client
    .from('expedition_salidas')
    .insert(input)
    .select('*')
    .single();
  if (error) throw error;
  return data as DbExpeditionSalida;
}

export async function updateSalida(
  client: SupabaseClient,
  id: string,
  patch: Partial<SalidaInput>,
): Promise<DbExpeditionSalida> {
  const { data, error } = await client
    .from('expedition_salidas')
    .update(patch)
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;
  return data as DbExpeditionSalida;
}

export async function deleteSalida(client: SupabaseClient, id: string): Promise<void> {
  const { error } = await client.from('expedition_salidas').delete().eq('id', id);
  if (error) throw error;
}

// =============================================================================
// Participations — who attended which salida, completion popup state, and
// the organizer-side review of the guest. See migration ..._participations_and_comms.
// =============================================================================

const PARTICIPATION_FULL_SELECT = `
  *,
  salida:expedition_salidas!participations_salida_id_fkey (*),
  expedition:expeditions!participations_expedition_id_fkey (
    id, title, location_name, region, country, cover_photo_url, difficulty
  )
`;

// Returns participations for the signed-in user where the salida has ended
// and the user hasn't yet acknowledged the completion popup. The app uses
// this on load to decide whether to pop the trip-completion modal.
export async function fetchUnacknowledgedCompletions(
  client: SupabaseClient,
): Promise<ParticipationWithSalida[]> {
  const { data: u } = await client.auth.getUser();
  if (!u.user) return [];
  const nowIso = new Date().toISOString();
  const { data, error } = await client
    .from('participations')
    .select(PARTICIPATION_FULL_SELECT)
    .eq('user_id', u.user.id)
    .is('completion_acknowledged_at', null)
    .order('created_at', { ascending: true });
  if (error) throw error;
  const rows = ((data ?? []) as unknown) as ParticipationWithSalida[];
  // Only return ones whose salida has actually ended. We can't filter that in
  // PostgREST via a nested column without a stored view, so filter client-side.
  return rows.filter((p) => {
    const endIso = p.salida?.ends_at ?? p.salida?.starts_at;
    if (!endIso) return false;
    return new Date(endIso).getTime() <= new Date(nowIso).getTime();
  });
}

export async function acknowledgeCompletion(
  client: SupabaseClient,
  participationId: string,
  stats: { distance_km?: number | null; elevation_m?: number | null } = {},
): Promise<void> {
  const { error } = await client
    .from('participations')
    .update({
      completion_acknowledged_at: new Date().toISOString(),
      ack_distance_km: stats.distance_km ?? null,
      ack_elevation_m: stats.elevation_m ?? null,
    })
    .eq('id', participationId);
  if (error) throw error;
}

// Used by the trip-completion modal to know whether the user crossed a tier
// threshold during the trip. Compares the current profile tier vs the tier
// captured at signup time.
const TIER_ORDER: Record<DbProfile['tier'], number> = {
  bronze: 0,
  silver: 1,
  gold: 2,
  diamond: 3,
};

export function didLevelUp(p: Pick<DbParticipation, 'tier_at_signup'>, currentTier: DbProfile['tier']): boolean {
  return TIER_ORDER[currentTier] > TIER_ORDER[p.tier_at_signup];
}

// Admin / organizer pages: list participations on a salida (people attended +
// pending guest reviews) and write organizer reviews.

export async function listSalidaParticipations(
  client: SupabaseClient,
  salidaId: string,
): Promise<(DbParticipation & { user: Pick<DbProfile, 'id' | 'username' | 'display_name' | 'avatar_url' | 'tier'> })[]> {
  const { data, error } = await client
    .from('participations')
    .select(`*, user:profiles!participations_user_id_fkey (id, username, display_name, avatar_url, tier)`)
    .eq('salida_id', salidaId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return ((data ?? []) as unknown) as (DbParticipation & {
    user: Pick<DbProfile, 'id' | 'username' | 'display_name' | 'avatar_url' | 'tier'>;
  })[];
}

export async function submitOrganizerReview(
  client: SupabaseClient,
  participationId: string,
  stars: 1 | 2 | 3 | 4 | 5,
  body: string,
): Promise<void> {
  const { data: u } = await client.auth.getUser();
  if (!u.user) throw new Error('Sign in to leave a review.');
  const { error } = await client
    .from('participations')
    .update({
      organizer_review_stars: stars,
      organizer_review_body: body,
      organizer_reviewed_at: new Date().toISOString(),
      organizer_reviewer_id: u.user.id,
    })
    .eq('id', participationId);
  if (error) throw error;
}

// =============================================================================
// Comm events + templates — see migration ..._participations_and_comms.
// =============================================================================

export async function fetchCommEventTypes(client: SupabaseClient): Promise<DbCommEventType[]> {
  const { data, error } = await client
    .from('comm_event_types')
    .select('*')
    .order('key', { ascending: true });
  if (error) throw error;
  return (data ?? []) as DbCommEventType[];
}

export async function fetchCommTemplates(
  client: SupabaseClient,
  opts: { eventKey?: string; locale?: CommLocale; channel?: CommChannel } = {},
): Promise<DbCommTemplate[]> {
  let q = client
    .from('comm_templates')
    .select('*')
    .order('event_key', { ascending: true })
    .order('locale', { ascending: true })
    .order('channel', { ascending: true });
  if (opts.eventKey) q = q.eq('event_key', opts.eventKey);
  if (opts.locale) q = q.eq('locale', opts.locale);
  if (opts.channel) q = q.eq('channel', opts.channel);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as DbCommTemplate[];
}

export type CommTemplateInput = {
  event_key: string;
  locale: CommLocale;
  channel: CommChannel;
  subject?: string | null;
  body: string;
  is_active?: boolean;
};

export async function upsertCommTemplate(
  client: SupabaseClient,
  input: CommTemplateInput,
): Promise<DbCommTemplate> {
  const { data, error } = await client
    .from('comm_templates')
    .upsert(input, { onConflict: 'event_key,locale,channel' })
    .select('*')
    .single();
  if (error) throw error;
  return data as DbCommTemplate;
}

export async function deleteCommTemplate(client: SupabaseClient, id: string): Promise<void> {
  const { error } = await client.from('comm_templates').delete().eq('id', id);
  if (error) throw error;
}
