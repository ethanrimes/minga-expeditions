import React from 'react';
import { Link } from 'react-router-dom';
import { useTheme, tierColors } from '@minga/theme';
import { formatDistanceKm, formatElevation, formatPriceCents } from '@minga/logic';
import { useT } from '@minga/i18n';
import type { ExpeditionWithAuthor, ExpeditionCategory, TierLevel } from '@minga/types';

const CATEGORY_KEY: Record<ExpeditionCategory, any> = {
  hiking: 'cat.hiking',
  cycling: 'cat.cycling',
  running: 'cat.running',
  trekking: 'cat.trekking',
  cultural: 'cat.cultural',
  wildlife: 'cat.wildlife',
  other: 'cat.other',
};

const TIER_KEY: Record<TierLevel, any> = {
  bronze: 'tier.bronze',
  silver: 'tier.silver',
  gold: 'tier.gold',
  diamond: 'tier.diamond',
};

export function ExpeditionTile({ expedition }: { expedition: ExpeditionWithAuthor }) {
  const { theme } = useTheme();
  const { t } = useT();
  const cover = expedition.cover_photo_url ?? expedition.photos[0]?.url;
  return (
    <Link
      to={`/expeditions/${expedition.id}`}
      style={{
        background: theme.surface,
        border: `1px solid ${theme.border}`,
        borderRadius: 18,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        transition: 'transform 150ms ease, box-shadow 150ms ease',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(-4px)';
        (e.currentTarget as HTMLAnchorElement).style.boxShadow = '0 14px 30px rgba(0,0,0,0.08)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(0)';
        (e.currentTarget as HTMLAnchorElement).style.boxShadow = 'none';
      }}
    >
      <div style={{ position: 'relative', aspectRatio: '4 / 3', background: theme.surfaceAlt }}>
        {cover ? <img src={cover} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : null}
        <span
          style={{
            position: 'absolute',
            top: 12,
            left: 12,
            background: theme.primary,
            color: theme.onPrimary,
            padding: '4px 10px',
            borderRadius: 6,
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: 0.4,
            textTransform: 'uppercase',
          }}
        >
          {t(CATEGORY_KEY[expedition.category])}
        </span>
        {expedition.is_official ? (
          <span
            style={{
              position: 'absolute',
              top: 12,
              right: 12,
              background: theme.accent,
              color: '#fff',
              padding: '4px 10px',
              borderRadius: 6,
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: 0.4,
            }}
          >
            {t('common.official')}
          </span>
        ) : null}
      </div>
      <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
        <h3 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: theme.text }}>{expedition.title}</h3>
        <div style={{ color: theme.textMuted, fontSize: 14 }}>
          {expedition.location_name}
          {expedition.region ? `, ${expedition.region}` : ''}
        </div>
        <div style={{ display: 'flex', gap: 16, color: theme.text, fontSize: 14 }}>
          {expedition.distance_km ? <span>🥾 {formatDistanceKm(expedition.distance_km)}</span> : null}
          {expedition.elevation_gain_m ? <span>⛰ {formatElevation(expedition.elevation_gain_m)}</span> : null}
          <span title={`${expedition.difficulty}/5`}>
            {'●'.repeat(expedition.difficulty)}
            {'○'.repeat(5 - expedition.difficulty)}
          </span>
        </div>
        <div style={{ flex: 1 }} />
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            paddingTop: 12,
            borderTop: `1px solid ${theme.border}`,
          }}
        >
          {expedition.author.avatar_url ? (
            <img
              src={expedition.author.avatar_url}
              alt=""
              style={{ width: 28, height: 28, borderRadius: 999, background: theme.surfaceAlt }}
            />
          ) : null}
          <span style={{ fontSize: 14, fontWeight: 600, color: theme.text, flex: 1 }}>
            {expedition.author.display_name}
          </span>
          <span
            style={{
              fontSize: 10,
              fontWeight: 800,
              color: '#fff',
              background: tierColors[expedition.author.tier],
              padding: '3px 8px',
              borderRadius: 999,
              letterSpacing: 0.5,
            }}
          >
            {t(TIER_KEY[expedition.author.tier])}
          </span>
          <span style={{ color: theme.primary, fontWeight: 800, fontSize: 14 }}>
            {formatPriceCents(expedition.price_cents, { currency: expedition.currency, freeLabel: t('common.free') })}
          </span>
        </div>
      </div>
    </Link>
  );
}
