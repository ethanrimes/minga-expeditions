import React, { useState } from 'react';
import { ScrollView, Text, View, ActivityIndicator } from 'react-native';
import { useTheme, spacing, fontSizes, fontWeights } from '@minga/theme';
import { useT } from '@minga/i18n';
import type { ExpeditionCategory } from '@minga/types';
import { Screen } from '../primitives/Screen';
import { CategoryChip } from '../primitives/CategoryChip';
import { ExpeditionCard } from '../components/ExpeditionCard';
import { SectionHeader } from '../components/SectionHeader';
import { EmptyState } from '../components/EmptyState';
import { useFeed } from '../hooks/useFeed';

export function FeedScreen({
  onOpenExpedition,
  initialCategory,
}: {
  onOpenExpedition: (id: string) => void;
  initialCategory?: ExpeditionCategory | 'all';
}) {
  const { theme } = useTheme();
  const { t } = useT();
  const [category, setCategory] = useState<ExpeditionCategory | 'all'>(initialCategory ?? 'all');
  const { expeditions, loading, error } = useFeed(category === 'all' ? null : category);

  const CATEGORIES: { label: string; value: ExpeditionCategory | 'all' }[] = [
    { label: t('feed.allCategory'), value: 'all' },
    { label: t('cat.hiking'), value: 'hiking' },
    { label: t('cat.cycling'), value: 'cycling' },
    { label: t('cat.trekking'), value: 'trekking' },
    { label: t('cat.cultural'), value: 'cultural' },
    { label: t('cat.wildlife'), value: 'wildlife' },
    { label: t('cat.running'), value: 'running' },
  ];

  return (
    <Screen>
      <View style={{ paddingTop: spacing.xl }}>
        <Text style={{ color: theme.textMuted, fontSize: fontSizes.sm, letterSpacing: 1 }}>
          MINGA EXPEDITIONS
        </Text>
        <Text style={{ color: theme.text, fontSize: fontSizes['2xl'], fontWeight: fontWeights.heavy }}>
          {t('feed.connectToColombia')}
        </Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={{ flexDirection: 'row', gap: spacing.sm, paddingVertical: spacing.xs }}>
          {CATEGORIES.map((c) => (
            <CategoryChip
              key={c.value}
              label={c.label}
              active={category === c.value}
              onPress={() => setCategory(c.value)}
            />
          ))}
        </View>
      </ScrollView>

      <SectionHeader title={t('feed.featuredExpeditions')} />

      {loading ? (
        <ActivityIndicator />
      ) : error ? (
        <EmptyState iconName="flag" title={t('empty.couldNotLoad')} body={error} />
      ) : expeditions.length === 0 ? (
        <EmptyState iconName="mountain" title={t('empty.noExpeditions')} body={t('feed.empty')} />
      ) : (
        <View style={{ gap: spacing.lg }}>
          {expeditions.map((exp) => (
            <ExpeditionCard key={exp.id} expedition={exp} onPress={() => onOpenExpedition(exp.id)} />
          ))}
        </View>
      )}
    </Screen>
  );
}
