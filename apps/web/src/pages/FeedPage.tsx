import React, { useEffect, useState } from 'react';
import { useTheme } from '@minga/theme';
import { fetchFeedExpeditions } from '@minga/supabase';
import type { ExpeditionCategory, ExpeditionWithAuthor } from '@minga/types';
import { supabase } from '../supabase';
import { ExpeditionTile } from '../components/ExpeditionTile';

const CATEGORIES: { label: string; value: ExpeditionCategory | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Hiking', value: 'hiking' },
  { label: 'Trekking', value: 'trekking' },
  { label: 'Cycling', value: 'cycling' },
  { label: 'Running', value: 'running' },
  { label: 'Cultural', value: 'cultural' },
  { label: 'Wildlife', value: 'wildlife' },
];

export function FeedPage() {
  const { theme } = useTheme();
  const [category, setCategory] = useState<ExpeditionCategory | 'all'>('all');
  const [data, setData] = useState<ExpeditionWithAuthor[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchFeedExpeditions(supabase, { category: category === 'all' ? null : category })
      .then((d) => !cancelled && setData(d))
      .catch((e) => !cancelled && setError(e?.message ?? 'Failed to load'))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [category]);

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 24px' }}>
      <h1 style={{ color: theme.text, fontSize: 40, fontWeight: 800, margin: 0 }}>Expeditions</h1>
      <p style={{ color: theme.textMuted, marginBottom: 24 }}>
        Find an adventure — or start tracking your own.
      </p>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 32 }}>
        {CATEGORIES.map((c) => {
          const active = c.value === category;
          return (
            <button
              key={c.value}
              onClick={() => setCategory(c.value)}
              style={{
                background: active ? theme.primary : theme.surfaceAlt,
                color: active ? theme.onPrimary : theme.text,
                border: `1px solid ${active ? theme.primary : theme.border}`,
                padding: '10px 18px',
                borderRadius: 999,
                fontWeight: 700,
                fontSize: 14,
              }}
            >
              {c.label}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div style={{ color: theme.textMuted }}>Loading…</div>
      ) : error ? (
        <div style={{ color: theme.danger }}>{error}</div>
      ) : data.length === 0 ? (
        <div style={{ color: theme.textMuted }}>No expeditions in this category yet.</div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: 24,
          }}
        >
          {data.map((e) => (
            <ExpeditionTile key={e.id} expedition={e} />
          ))}
        </div>
      )}
    </div>
  );
}
