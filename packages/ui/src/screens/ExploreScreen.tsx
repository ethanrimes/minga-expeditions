import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { useTheme, spacing, fontSizes, fontWeights, radii } from '@minga/theme';
import { fetchExpeditionCategories, getSupabase } from '@minga/supabase';
import type { ExpeditionCategory } from '@minga/types';
import { Screen } from '../primitives/Screen';
import { SectionHeader } from '../components/SectionHeader';

const CATEGORY_META: Record<ExpeditionCategory, { emoji: string; label: string }> = {
  hiking: { emoji: '🥾', label: 'Hiking' },
  cycling: { emoji: '🚴', label: 'Cycling' },
  running: { emoji: '🏃', label: 'Running' },
  trekking: { emoji: '⛰️', label: 'Trekking' },
  cultural: { emoji: '🎭', label: 'Cultural' },
  wildlife: { emoji: '🦋', label: 'Wildlife' },
  other: { emoji: '✨', label: 'Other' },
};

export function ExploreScreen({ onPickCategory }: { onPickCategory: (cat: ExpeditionCategory) => void }) {
  const { theme } = useTheme();
  const [cats, setCats] = useState<{ category: ExpeditionCategory; count: number }[]>([]);

  useEffect(() => {
    fetchExpeditionCategories(getSupabase()).then(setCats).catch(() => undefined);
  }, []);

  return (
    <Screen>
      <View style={{ paddingTop: spacing.xl }}>
        <Text style={{ color: theme.text, fontSize: fontSizes['2xl'], fontWeight: fontWeights.heavy }}>Explore</Text>
        <Text style={{ color: theme.textMuted }}>Find expeditions by category</Text>
      </View>

      <SectionHeader title="Categories" />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md }}>
        {(Object.keys(CATEGORY_META) as ExpeditionCategory[]).map((k) => {
          const count = cats.find((c) => c.category === k)?.count ?? 0;
          return (
            <View
              key={k}
              style={{
                width: '47%',
                backgroundColor: theme.surfaceAlt,
                borderRadius: radii.lg,
                padding: spacing.lg,
                gap: spacing.xs,
              }}
              onTouchEnd={() => onPickCategory(k)}
            >
              <Text style={{ fontSize: 32 }}>{CATEGORY_META[k].emoji}</Text>
              <Text style={{ color: theme.text, fontWeight: fontWeights.bold }}>{CATEGORY_META[k].label}</Text>
              <Text style={{ color: theme.textMuted, fontSize: fontSizes.sm }}>{count} expedition{count === 1 ? '' : 's'}</Text>
            </View>
          );
        })}
      </View>
    </Screen>
  );
}
