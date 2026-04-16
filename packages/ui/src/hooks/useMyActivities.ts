import { useCallback, useEffect, useState } from 'react';
import { fetchMyActivities, getSupabase } from '@minga/supabase';
import type { DbActivity } from '@minga/types';

export function useMyActivities() {
  const [activities, setActivities] = useState<DbActivity[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setActivities(await fetchMyActivities(getSupabase()));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return { activities, loading, reload: load };
}
