import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { useTheme, spacing, fontSizes, fontWeights, radii } from '@minga/theme';
import { fetchExpeditionCategories, getSupabase } from '@minga/supabase';
import { useT } from '@minga/i18n';
import type { ExpeditionCategory } from '@minga/types';
import { Screen } from '../primitives/Screen';
import { SectionHeader } from '../components/SectionHeader';

const CATEGORY_META: Record<ExpeditionCategory, { emoji: string; key: any }> = {
  hiking: { emoji: '🥾', key: 'cat.hiking' },
  cycling: { emoji: '🚴', key: 'cat.cycling' },
  running: { emoji: '🏃', key: 'cat.running' },
  trekking: { emoji: '⛰️', key: 'cat.trekking' },
  cultural: { emoji: '🎭', key: 'cat.cultural' },
  wildlife: { emoji: '🦋', key: 'cat.wildlife' },
  other: { emoji: '✨', key: 'cat.other' },
};

export function ExploreScreen({ onPickCategory }: { onPickCategory: (cat: ExpeditionCategory) => void }) {
  const { theme } = useTheme();
  const { t } = useT();
  const [cats, setCats] = useState<{ category: ExpeditionCategory; count: number }[]>([]);

  useEffect(() => {
    fetchExpeditionCategories(getSupabase()).then(setCats).catch(() => undefined);
  }, []);

  return (
    <Screen>
      <View style={{ paddingTop: spacing.xl }}>
        <Text style={{ color: theme.text, fontSize: fontSizes['2xl'], fontWeight: fontWeights.heavy }}>
          {t('explore.title')}
        </Text>
        <Text style={{ color: theme.textMuted }}>{t('explore.subtitle')}</Text>
      </View>

      <SectionHeader title={t('explore.categories')} />
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
              <Text style={{ color: theme.text, fontWeight: fontWeights.bold }}>{t(CATEGORY_META[k].key)}</Text>
              <Text style={{ color: theme.textMuted, fontSize: fontSizes.sm }}>
                {count} {count === 1 ? t('common.expeditionCountOne') : t('common.expeditionCount')}
              </Text>
            </View>
          );
        })}
      </View>
    </Screen>
  );
}
