import { useCallback, useEffect, useState } from 'react';
import { fetchFeedExpeditions, getSupabase } from '@minga/supabase';
import type { ExpeditionWithAuthor } from '@minga/types';

export function useFeed(category: string | null = null) {
  const [expeditions, setExpeditions] = useState<ExpeditionWithAuthor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchFeedExpeditions(getSupabase(), { category });
      setExpeditions(data);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load feed');
    } finally {
      setLoading(false);
    }
  }, [category]);

  useEffect(() => {
    void load();
  }, [load]);

  return { expeditions, loading, error, reload: load };
}
