import { useCallback, useEffect, useState } from 'react';
import {
  fetchComments,
  fetchExpeditionById,
  fetchSalidasForExpedition,
  getSupabase,
  postComment,
  rateExpedition,
  toggleLike,
} from '@minga/supabase';
import type { CommentWithAuthor, DbExpeditionSalida, ExpeditionWithAuthor } from '@minga/types';

export function useExpedition(id: string | null) {
  const [expedition, setExpedition] = useState<ExpeditionWithAuthor | null>(null);
  const [comments, setComments] = useState<CommentWithAuthor[]>([]);
  const [salidas, setSalidas] = useState<DbExpeditionSalida[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const [exp, cmts, sals] = await Promise.all([
        fetchExpeditionById(getSupabase(), id),
        fetchComments(getSupabase(), id),
        fetchSalidasForExpedition(getSupabase(), id, { upcomingOnly: true }),
      ]);
      setExpedition(exp);
      setComments(cmts);
      setSalidas(sals);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load expedition');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const reply = async (parentId: string, body: string) => {
    if (!id) return;
    await postComment(getSupabase(), { expedition_id: id, body, parent_id: parentId });
    await load();
  };

  const rootComment = async (body: string) => {
    if (!id) return;
    await postComment(getSupabase(), { expedition_id: id, body });
    await load();
  };

  const like = async () => {
    if (!id) return;
    await toggleLike(getSupabase(), id);
    await load();
  };

  const rate = async (stars: 1 | 2 | 3 | 4 | 5, review?: string) => {
    if (!id) return;
    await rateExpedition(getSupabase(), { expedition_id: id, stars, review });
    await load();
  };

  return { expedition, comments, salidas, loading, error, reload: load, reply, rootComment, like, rate };
}
