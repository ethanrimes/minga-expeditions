import React, { useEffect, useState } from 'react';
import { useTheme } from '@minga/theme';
import { useT } from '@minga/i18n';
import { fetchFeedExpeditions } from '@minga/supabase';
import type { ExpeditionCategory, ExpeditionWithAuthor } from '@minga/types';
import { supabase } from '../supabase';
import { ExpeditionTile } from '../components/ExpeditionTile';

export function FeedPage() {
  const { theme } = useTheme();
  const { t } = useT();
  const [category, setCategory] = useState<ExpeditionCategory | 'all'>('all');
  const [data, setData] = useState<ExpeditionWithAuthor[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const CATEGORIES: { label: string; value: ExpeditionCategory | 'all' }[] = [
    { label: t('feed.allCategory'), value: 'all' },
    { label: t('cat.hiking'), value: 'hiking' },
    { label: t('cat.trekking'), value: 'trekking' },
    { label: t('cat.cycling'), value: 'cycling' },
    { label: t('cat.running'), value: 'running' },
    { label: t('cat.cultural'), value: 'cultural' },
    { label: t('cat.wildlife'), value: 'wildlife' },
  ];

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchFeedExpeditions(supabase, { category: category === 'all' ? null : category })
      .then((d) => !cancelled && setData(d))
      .catch((e) => !cancelled && setError(e?.message ?? t('common.loadError')))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [category]);

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 24px' }}>
      <h1 style={{ color: theme.text, fontSize: 40, fontWeight: 800, margin: 0 }}>{t('feed.title')}</h1>
      <p style={{ color: theme.textMuted, marginBottom: 24 }}>{t('feed.subtitle')}</p>
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
        <div style={{ color: theme.textMuted }}>{t('feed.loading')}</div>
      ) : error ? (
        <div style={{ color: theme.danger }}>{error}</div>
      ) : data.length === 0 ? (
        <div style={{ color: theme.textMuted }}>{t('feed.empty')}</div>
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
