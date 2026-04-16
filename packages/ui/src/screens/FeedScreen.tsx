import React, { useState } from 'react';
import { ScrollView, Text, View, ActivityIndicator } from 'react-native';
import { useTheme, spacing, fontSizes, fontWeights } from '@minga/theme';
import type { ExpeditionCategory } from '@minga/types';
import { Screen } from '../primitives/Screen';
import { CategoryChip } from '../primitives/CategoryChip';
import { ExpeditionCard } from '../components/ExpeditionCard';
import { SectionHeader } from '../components/SectionHeader';
import { EmptyState } from '../components/EmptyState';
import { useFeed } from '../hooks/useFeed';

const CATEGORIES: { label: string; value: ExpeditionCategory | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Hiking', value: 'hiking' },
  { label: 'Cycling', value: 'cycling' },
  { label: 'Trekking', value: 'trekking' },
  { label: 'Cultural', value: 'cultural' },
  { label: 'Wildlife', value: 'wildlife' },
  { label: 'Running', value: 'running' },
];

export function FeedScreen({ onOpenExpedition }: { onOpenExpedition: (id: string) => void }) {
  const { theme } = useTheme();
  const [category, setCategory] = useState<ExpeditionCategory | 'all'>('all');
  const { expeditions, loading, error } = useFeed(category === 'all' ? null : category);

  return (
    <Screen>
      <View style={{ paddingTop: spacing.xl }}>
        <Text style={{ color: theme.textMuted, fontSize: fontSizes.sm, letterSpacing: 1 }}>MINGA EXPEDITIONS</Text>
        <Text style={{ color: theme.text, fontSize: fontSizes['2xl'], fontWeight: fontWeights.heavy }}>
          Connect to Colombia
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

      <SectionHeader title="Featured expeditions" />

      {loading ? (
        <ActivityIndicator />
      ) : error ? (
        <EmptyState icon="⚠️" title="Couldn't load feed" body={error} />
      ) : expeditions.length === 0 ? (
        <EmptyState icon="🏔️" title="No expeditions yet" body="Try a different category." />
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
