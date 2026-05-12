import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { useTheme } from '@minga/theme';
import { useT, type TranslationKey } from '@minga/i18n';
import type { DbCategory, TerrainTag } from '@minga/types';
import { formatPriceCents } from '@minga/logic';

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

export interface Props {
  open: boolean;
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
  open,
  onClose,
  value,
  onChange,
  categories,
  regions,
  priceCeilingCents,
  currency,
}: Props) {
  const { theme } = useTheme();
  const { t, language } = useT();
  const [draft, setDraft] = useState<CalendarFilterState>(value);

  useEffect(() => {
    if (open) setDraft(value);
  }, [open, value]);

  if (!open) return null;

  const apply = () => {
    onChange(draft);
    onClose();
  };
  const reset = () => setDraft(emptyCalendarFilter(priceCeilingCents));

  const toggleArr = <T,>(arr: T[], v: T): T[] =>
    arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];

  return (
    <div
      role="dialog"
      aria-modal
      data-testid="calendar-filter-modal"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.55)',
        zIndex: 200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 'min(640px, 100%)',
          maxHeight: '90vh',
          background: theme.background,
          color: theme.text,
          borderRadius: 20,
          boxShadow: '0 30px 70px rgba(0,0,0,0.4)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <header
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '20px 24px',
            borderBottom: `1px solid ${theme.border}`,
          }}
        >
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>{t('cal.filters.open')}</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              background: 'transparent',
              border: 0,
              color: theme.textMuted,
              cursor: 'pointer',
              padding: 4,
            }}
          >
            <X size={20} />
          </button>
        </header>

        <div style={{ padding: 24, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
          <Section title={t('cal.filters.activity')}>
            <TileRow>
              {categories.map((c) => (
                <Tile
                  key={c.id}
                  label={language === 'es' ? c.name_es : c.name_en}
                  active={draft.categoryIds.includes(c.id)}
                  onClick={() => setDraft((d) => ({ ...d, categoryIds: toggleArr(d.categoryIds, c.id) }))}
                />
              ))}
            </TileRow>
          </Section>

          <Section title={t('cal.filters.biome')}>
            <TileRow>
              {ALL_TERRAIN.map((tag) => (
                <Tile
                  key={tag}
                  label={t(TERRAIN_KEY[tag])}
                  active={draft.terrainTags.includes(tag)}
                  onClick={() =>
                    setDraft((d) => ({ ...d, terrainTags: toggleArr(d.terrainTags, tag) }))
                  }
                />
              ))}
            </TileRow>
          </Section>

          <Section title={t('cal.filters.priceRange')}>
            <PriceRange
              min={0}
              max={priceCeilingCents}
              step={PRICE_STEP_COP}
              value={[draft.priceMinCents, draft.priceMaxCents]}
              onChange={([lo, hi]) =>
                setDraft((d) => ({ ...d, priceMinCents: lo, priceMaxCents: hi }))
              }
              currency={currency}
              freeLabel={t('common.free')}
              ceilingIsOpen
            />
          </Section>

          {regions.length > 0 ? (
            <Section title={t('cal.filters.department')}>
              <TileRow>
                {regions.map((r) => (
                  <Tile
                    key={r}
                    label={r}
                    active={draft.regions.includes(r)}
                    onClick={() => setDraft((d) => ({ ...d, regions: toggleArr(d.regions, r) }))}
                  />
                ))}
              </TileRow>
            </Section>
          ) : null}

          <Section title={t('cal.filters.difficulty')}>
            <TileRow>
              {[1, 2, 3, 4, 5].map((d) => (
                <Tile
                  key={d}
                  label={`${'●'.repeat(d)}${'○'.repeat(5 - d)}`}
                  active={draft.difficulty === d}
                  onClick={() =>
                    setDraft((s) => ({ ...s, difficulty: s.difficulty === d ? null : d }))
                  }
                />
              ))}
            </TileRow>
          </Section>

          <Section title={t('cal.filters.minRating')}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ display: 'flex', gap: 4 }}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() =>
                      setDraft((s) => ({ ...s, minRating: s.minRating === n ? 0 : n }))
                    }
                    style={{
                      background: 'transparent',
                      border: 0,
                      cursor: 'pointer',
                      fontSize: 28,
                      color: draft.minRating >= n ? theme.accent : theme.textMuted,
                      lineHeight: 1,
                      padding: 0,
                    }}
                  >
                    ★
                  </button>
                ))}
              </div>
              {draft.minRating === 0 ? (
                <span style={{ color: theme.textMuted, fontSize: 13 }}>
                  {t('cal.filters.anyRating')}
                </span>
              ) : null}
            </div>
          </Section>

        </div>

        <footer
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '16px 24px',
            borderTop: `1px solid ${theme.border}`,
            gap: 8,
          }}
        >
          <button
            type="button"
            onClick={reset}
            style={{
              background: 'transparent',
              border: 0,
              color: theme.primary,
              fontWeight: 700,
              cursor: 'pointer',
              padding: '6px 8px',
            }}
          >
            {t('cal.filters.reset')}
          </button>
          <button
            type="button"
            onClick={apply}
            style={{
              background: theme.primary,
              color: theme.onPrimary,
              border: 0,
              borderRadius: 999,
              padding: '10px 22px',
              fontWeight: 800,
              cursor: 'pointer',
            }}
          >
            {t('cal.filters.apply')}
          </button>
        </footer>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const { theme } = useTheme();
  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div
        style={{
          color: theme.text,
          fontWeight: 700,
          fontSize: 12,
          letterSpacing: 0.5,
          textTransform: 'uppercase',
        }}
      >
        {title}
      </div>
      {children}
    </section>
  );
}

function TileRow({ children }: { children: React.ReactNode }) {
  return <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>{children}</div>;
}

function Tile({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  const { theme } = useTheme();
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        background: active ? theme.primary : theme.surfaceAlt,
        color: active ? theme.onPrimary : theme.text,
        border: `1px solid ${active ? theme.primary : theme.border}`,
        borderRadius: 10,
        padding: '8px 14px',
        fontWeight: 600,
        fontSize: 13,
        cursor: 'pointer',
      }}
    >
      {label}
    </button>
  );
}

// Dual-handle range with two stacked <input type="range"> on the same track.
// Standard CSS-only trick — we let the user drag whichever thumb is closer to
// their pointer, and clamp the values so the handles never cross.
function PriceRange({
  min,
  max,
  step,
  value,
  onChange,
  currency,
  freeLabel,
  ceilingIsOpen,
}: {
  min: number;
  max: number;
  step: number;
  value: [number, number];
  onChange: (next: [number, number]) => void;
  currency: string;
  freeLabel: string;
  ceilingIsOpen?: boolean;
}) {
  const { theme } = useTheme();
  const [lo, hi] = value;
  const lowPct = ((lo - min) / Math.max(1, max - min)) * 100;
  const highPct = ((hi - min) / Math.max(1, max - min)) * 100;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          color: theme.textMuted,
          fontSize: 12,
        }}
      >
        <span>{formatPriceCents(lo, { currency, freeLabel })}</span>
        <span>
          {hi >= max && ceilingIsOpen
            ? `${formatPriceCents(max, { currency, freeLabel })}+`
            : formatPriceCents(hi, { currency, freeLabel })}
        </span>
      </div>
      <div style={{ position: 'relative', height: 28 }}>
        <div
          style={{
            position: 'absolute',
            top: 12,
            left: 0,
            right: 0,
            height: 4,
            background: theme.surfaceAlt,
            borderRadius: 4,
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: 12,
            left: `${lowPct}%`,
            width: `${Math.max(0, highPct - lowPct)}%`,
            height: 4,
            background: theme.primary,
            borderRadius: 4,
          }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={lo}
          onChange={(e) => {
            const v = Math.min(Number(e.target.value), hi);
            onChange([v, hi]);
          }}
          className="minga-dual-range"
          style={dualRangeInputStyle()}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={hi}
          onChange={(e) => {
            const v = Math.max(Number(e.target.value), lo);
            onChange([lo, v]);
          }}
          className="minga-dual-range"
          style={dualRangeInputStyle()}
        />
      </div>
    </div>
  );
}

function dualRangeInputStyle(): React.CSSProperties {
  // Both range inputs share the same track. `pointer-events: none` on the
  // bar lets the thumb itself remain interactive — that's restored on the
  // ::-webkit-slider-thumb pseudo-element via global CSS in styles.css.
  return {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    width: '100%',
    height: 28,
    background: 'transparent',
    pointerEvents: 'none',
    appearance: 'none',
    WebkitAppearance: 'none',
    margin: 0,
  };
}
