import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  DbActivity,
  DbActivityComment,
  DbActivityRating,
  DbActivityTrackPoint,
  DbComment,
  DbExpedition,
  DbProfile,
  ExpeditionWithAuthor,
  CommentWithAuthor,
  TrackPoint,
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
