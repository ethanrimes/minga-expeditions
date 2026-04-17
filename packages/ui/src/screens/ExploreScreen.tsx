import React, { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useTheme, spacing, fontSizes, fontWeights, radii } from '@minga/theme';
import { fetchExpeditionCategories, getSupabase } from '@minga/supabase';
import { useT } from '@minga/i18n';
import type { ExpeditionCategory } from '@minga/types';
import { Screen } from '../primitives/Screen';
import { Icon, type IconName } from '../primitives/Icon';
import { SectionHeader } from '../components/SectionHeader';

const CATEGORY_META: Record<ExpeditionCategory, { icon: IconName; key: any }> = {
  hiking: { icon: 'mountain', key: 'cat.hiking' },
  cycling: { icon: 'bike', key: 'cat.cycling' },
  running: { icon: 'footprints', key: 'cat.running' },
  trekking: { icon: 'mountain-snow', key: 'cat.trekking' },
  cultural: { icon: 'drama', key: 'cat.cultural' },
  wildlife: { icon: 'leaf', key: 'cat.wildlife' },
  other: { icon: 'sparkles', key: 'cat.other' },
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
            <Pressable
              key={k}
              onPress={() => onPickCategory(k)}
              style={{
                width: '47%',
                backgroundColor: theme.surfaceAlt,
                borderRadius: radii.lg,
                padding: spacing.lg,
                gap: spacing.sm,
              }}
            >
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: radii.md,
                  backgroundColor: theme.primaryMuted,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Icon name={CATEGORY_META[k].icon} size={24} color={theme.primary} strokeWidth={2.2} />
              </View>
              <Text style={{ color: theme.text, fontWeight: fontWeights.bold }}>{t(CATEGORY_META[k].key)}</Text>
              <Text style={{ color: theme.textMuted, fontSize: fontSizes.sm }}>
                {count} {count === 1 ? t('common.expeditionCountOne') : t('common.expeditionCount')}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </Screen>
  );
}
