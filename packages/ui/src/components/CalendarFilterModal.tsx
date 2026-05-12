import React, { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { useTheme, spacing, fontSizes, fontWeights, radii } from '@minga/theme';
import { useT, type TranslationKey } from '@minga/i18n';
import type { DbCategory, TerrainTag } from '@minga/types';
import { formatPriceCents } from '@minga/logic';
import { Button } from '../primitives/Button';
import { Icon } from '../primitives/Icon';
import { StarRating } from '../primitives/StarRating';
import { DualRangeSlider } from '../primitives/DualRangeSlider';

export type CalendarViewMode = 'grid' | 'agenda';

export interface CalendarFilterState {
  categoryIds: string[];
  terrainTags: TerrainTag[];
  regions: string[];
  difficulty: number | null;
  minRating: number;
  priceMinCents: number;
  priceMaxCents: number;
}

export interface CalendarFilterModalProps {
  visible: boolean;
  onClose: () => void;
  value: CalendarFilterState;
  onChange: (next: CalendarFilterState) => void;
  categories: DbCategory[];
  regions: string[];
  priceCeilingCents: number;
  currency: string;
}

const ALL_TERRAIN: TerrainTag[] = [
  'mountain',
  'flat',
  'desert',
  'river',
  'forest',
  'coast',
  'urban',
  'jungle',
  'snow',
];

const TERRAIN_KEY: Record<TerrainTag, TranslationKey> = {
  mountain: 'track.terrain.mountain',
  flat: 'track.terrain.flat',
  desert: 'track.terrain.desert',
  river: 'track.terrain.river',
  forest: 'track.terrain.forest',
  coast: 'track.terrain.coast',
  urban: 'track.terrain.urban',
  jungle: 'track.terrain.jungle',
  snow: 'track.terrain.snow',
};

const PRICE_STEP_COP = 50_000_00; // 50,000 COP

export function emptyCalendarFilter(priceCeilingCents: number): CalendarFilterState {
  return {
    categoryIds: [],
    terrainTags: [],
    regions: [],
    difficulty: null,
    minRating: 0,
    priceMinCents: 0,
    priceMaxCents: priceCeilingCents,
  };
}

export function countActiveFilters(s: CalendarFilterState, priceCeilingCents: number): number {
  let n = 0;
  if (s.categoryIds.length > 0) n += 1;
  if (s.terrainTags.length > 0) n += 1;
  if (s.regions.length > 0) n += 1;
  if (s.difficulty != null) n += 1;
  if (s.minRating > 0) n += 1;
  if (s.priceMinCents > 0 || s.priceMaxCents < priceCeilingCents) n += 1;
  return n;
}

export function CalendarFilterModal({
  visible,
  onClose,
  value,
  onChange,
  categories,
  regions,
  priceCeilingCents,
  currency,
}: CalendarFilterModalProps) {
  const { theme } = useTheme();
  const { t, language } = useT();
  const [draft, setDraft] = useState<CalendarFilterState>(value);

  // Resync from upstream whenever the modal becomes visible — the parent
  // owns the canonical state, and we want a fresh editing buffer each open.
  useEffect(() => {
    if (visible) setDraft(value);
  }, [visible, value]);

  const apply = () => {
    onChange(draft);
    onClose();
  };
  const reset = () => setDraft(emptyCalendarFilter(priceCeilingCents));

  const toggleCategory = (id: string) =>
    setDraft((d) => ({
      ...d,
      categoryIds: d.categoryIds.includes(id)
        ? d.categoryIds.filter((x) => x !== id)
        : [...d.categoryIds, id],
    }));

  const toggleTerrain = (tag: TerrainTag) =>
    setDraft((d) => ({
      ...d,
      terrainTags: d.terrainTags.includes(tag)
        ? d.terrainTags.filter((x) => x !== tag)
        : [...d.terrainTags, tag],
    }));

  const toggleRegion = (r: string) =>
    setDraft((d) => ({
      ...d,
      regions: d.regions.includes(r) ? d.regions.filter((x) => x !== r) : [...d.regions, r],
    }));

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' }}>
        <View
          style={{
            backgroundColor: theme.background,
            borderTopLeftRadius: radii.xl,
            borderTopRightRadius: radii.xl,
            maxHeight: '92%',
            paddingHorizontal: spacing.lg,
            paddingTop: spacing.md,
            paddingBottom: spacing.lg,
            gap: spacing.md,
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Text style={{ color: theme.text, fontSize: fontSizes.xl, fontWeight: fontWeights.heavy }}>
              {t('cal.filters.open')}
            </Text>
            <Pressable onPress={onClose} hitSlop={12} accessibilityLabel="Close">
              <Icon name="x" size={22} color={theme.textMuted} strokeWidth={2.4} />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={{ gap: spacing.lg, paddingBottom: spacing.md }}>
            <Section title={t('cal.filters.activity')}>
              <TileGrid>
                {categories.map((c) => (
                  <Tile
                    key={c.id}
                    label={language?.startsWith('es') ? c.name_es : c.name_en}
                    active={draft.categoryIds.includes(c.id)}
                    onPress={() => toggleCategory(c.id)}
                  />
                ))}
              </TileGrid>
            </Section>

            <Section title={t('cal.filters.biome')}>
              <TileGrid>
                {ALL_TERRAIN.map((tag) => (
                  <Tile
                    key={tag}
                    label={t(TERRAIN_KEY[tag])}
                    active={draft.terrainTags.includes(tag)}
                    onPress={() => toggleTerrain(tag)}
                  />
                ))}
              </TileGrid>
            </Section>

            <Section title={t('cal.filters.priceRange')}>
              <View style={{ gap: spacing.xs }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ color: theme.textMuted, fontSize: fontSizes.xs }}>
                    {formatPriceCents(draft.priceMinCents, { currency, freeLabel: t('common.free') })}
                  </Text>
                  <Text style={{ color: theme.textMuted, fontSize: fontSizes.xs }}>
                    {draft.priceMaxCents >= priceCeilingCents
                      ? `${formatPriceCents(priceCeilingCents, { currency, freeLabel: t('common.free') })}+`
                      : formatPriceCents(draft.priceMaxCents, { currency, freeLabel: t('common.free') })}
                  </Text>
                </View>
                <DualRangeSlider
                  min={0}
                  max={priceCeilingCents}
                  step={PRICE_STEP_COP}
                  value={[draft.priceMinCents, draft.priceMaxCents]}
                  onChange={([lo, hi]) =>
                    setDraft((d) => ({ ...d, priceMinCents: lo, priceMaxCents: hi }))
                  }
                />
              </View>
            </Section>

            {regions.length > 0 ? (
              <Section title={t('cal.filters.department')}>
                <TileGrid>
                  {regions.map((r) => (
                    <Tile
                      key={r}
                      label={r}
                      active={draft.regions.includes(r)}
                      onPress={() => toggleRegion(r)}
                    />
                  ))}
                </TileGrid>
              </Section>
            ) : null}

            <Section title={t('cal.filters.difficulty')}>
              <TileGrid>
                {[1, 2, 3, 4, 5].map((d) => (
                  <Tile
                    key={d}
                    label={`${'●'.repeat(d)}${'○'.repeat(5 - d)}`}
                    active={draft.difficulty === d}
                    onPress={() =>
                      setDraft((s) => ({ ...s, difficulty: s.difficulty === d ? null : d }))
                    }
                  />
                ))}
              </TileGrid>
            </Section>

            <Section title={t('cal.filters.minRating')}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                <StarRating
                  value={draft.minRating}
                  size={fontSizes['2xl']}
                  onChange={(n) =>
                    setDraft((s) => ({ ...s, minRating: s.minRating === n ? 0 : n }))
                  }
                />
                {draft.minRating === 0 ? (
                  <Text style={{ color: theme.textMuted, fontSize: fontSizes.sm }}>
                    {t('cal.filters.anyRating')}
                  </Text>
                ) : null}
              </View>
            </Section>

          </ScrollView>

          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <Button label={t('cal.filters.reset')} variant="ghost" onPress={reset} />
            <View style={{ flex: 1 }}>
              <Button label={t('cal.filters.apply')} onPress={apply} fullWidth />
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const { theme } = useTheme();
  return (
    <View style={{ gap: spacing.xs }}>
      <Text
        style={{
          color: theme.text,
          fontSize: fontSizes.sm,
          fontWeight: fontWeights.bold,
          letterSpacing: 0.5,
          textTransform: 'uppercase',
        }}
      >
        {title}
      </Text>
      {children}
    </View>
  );
}

function TileGrid({ children }: { children: React.ReactNode }) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>{children}</View>
  );
}

function Tile({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  const { theme } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={{
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: radii.md,
        backgroundColor: active ? theme.primary : theme.surfaceAlt,
        borderWidth: 1,
        borderColor: active ? theme.primary : theme.border,
      }}
    >
      <Text
        style={{
          color: active ? theme.onPrimary : theme.text,
          fontSize: fontSizes.sm,
          fontWeight: fontWeights.semibold,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}
