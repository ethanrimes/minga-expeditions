import React, { useEffect, useState } from 'react';
import { PartyPopper, Trophy, X } from 'lucide-react';
import { useTheme, tierColors } from '@minga/theme';
import { useT } from '@minga/i18n';
import {
  acknowledgeCompletion,
  didLevelUp,
  fetchProfile,
  rateExpedition,
} from '@minga/supabase';
import { formatDistanceKm, formatElevation } from '@minga/logic';
import type { ParticipationWithSalida, TierLevel } from '@minga/types';
import { supabase } from '../supabase';

interface Props {
  participation: ParticipationWithSalida;
  onClose: () => void;
}

const TIER_LABEL: Record<TierLevel, string> = {
  bronze: 'Bronze',
  silver: 'Silver',
  gold: 'Gold',
  diamond: 'Diamond',
};

// Lightweight pure-CSS confetti — 80 absolutely positioned squares that drift
// down. Avoids adding a confetti library just for the level-up moment.
function Confetti({ active }: { active: boolean }) {
  if (!active) return null;
  const colors = ['#ED8B00', '#FFE3B8', '#1F8A4C', '#9AA1AE', '#D14343'];
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
      <style>{`
        @keyframes mingaConfetti {
          0%   { transform: translate3d(0,-20vh,0) rotate(0deg); opacity: 1; }
          100% { transform: translate3d(0,120vh,0) rotate(540deg); opacity: 0; }
        }
      `}</style>
      {Array.from({ length: 80 }).map((_, i) => {
        const left = (i * 73) % 100;
        const delay = (i % 13) * 0.18;
        const duration = 2.4 + ((i % 7) * 0.32);
        const color = colors[i % colors.length];
        const size = 6 + (i % 4) * 3;
        return (
          <span
            key={i}
            style={{
              position: 'absolute',
              left: `${left}%`,
              top: 0,
              width: size,
              height: size * 0.4,
              background: color,
              borderRadius: 2,
              animation: `mingaConfetti ${duration}s linear ${delay}s forwards`,
            }}
          />
        );
      })}
    </div>
  );
}

export function TripCompletionModal({ participation, onClose }: Props) {
  const { theme } = useTheme();
  const { t } = useT();
  const [stars, setStars] = useState<number>(0);
  const [review, setReview] = useState('');
  const [saving, setSaving] = useState(false);
  const [currentTier, setCurrentTier] = useState<TierLevel>(participation.tier_at_signup);
  const [hasLevelUp, setHasLevelUp] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      const profile = await fetchProfile(supabase, u.user.id);
      if (cancelled || !profile) return;
      setCurrentTier(profile.tier);
      setHasLevelUp(didLevelUp(participation, profile.tier));
    })();
    return () => {
      cancelled = true;
    };
  }, [participation]);

  const distance = participation.salida.starts_at ? null : null; // placeholder
  // We don't have a per-trip activity total here yet — show the salida's
  // expedition's authored stats as a stand-in. A future migration could roll
  // up real activity totals between starts_at and ends_at into the participation row.
  const distanceKm = participation.ack_distance_km ?? 0;
  const elevationM = participation.ack_elevation_m ?? 0;

  async function submit() {
    setSaving(true);
    try {
      if (stars > 0) {
        await rateExpedition(supabase, {
          expedition_id: participation.expedition_id,
          stars: stars as 1 | 2 | 3 | 4 | 5,
          review: review.trim() || undefined,
        });
      }
      await acknowledgeCompletion(supabase, participation.id, {
        distance_km: distanceKm || null,
        elevation_m: elevationM || null,
      });
      onClose();
    } catch (e) {
      console.warn('completion submit failed', e);
    } finally {
      setSaving(false);
    }
  }

  async function dismiss() {
    setSaving(true);
    try {
      await acknowledgeCompletion(supabase, participation.id, {});
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal
      data-testid="trip-completion-modal"
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
      <Confetti active={hasLevelUp} />
      <div
        style={{
          width: 'min(520px, 100%)',
          background: theme.background,
          color: theme.text,
          borderRadius: 24,
          padding: 28,
          boxShadow: '0 30px 70px rgba(0,0,0,0.4)',
          maxHeight: '90vh',
          overflowY: 'auto',
          position: 'relative',
        }}
      >
        <button
          onClick={dismiss}
          aria-label="Close"
          style={{
            position: 'absolute',
            top: 14,
            right: 14,
            background: 'transparent',
            border: 0,
            color: theme.textMuted,
            cursor: 'pointer',
            padding: 4,
          }}
        >
          <X size={20} />
        </button>

        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: theme.primary, fontWeight: 800, fontSize: 13, letterSpacing: 1 }}>
          <PartyPopper size={18} /> MINGA
        </div>
        <h2 style={{ margin: '4px 0 4px', fontSize: 24, fontWeight: 800 }}>
          {t('completion.title').replace('{title}', participation.expedition.title)}
        </h2>
        <p style={{ color: theme.textMuted, margin: '0 0 20px' }}>{t('completion.subtitle')}</p>

        {hasLevelUp ? (
          <div
            data-testid="level-up-banner"
            style={{
              background: tierColors[currentTier],
              color: '#fff',
              borderRadius: 14,
              padding: '14px 18px',
              marginBottom: 16,
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <Trophy size={28} />
            <div>
              <div style={{ fontWeight: 800 }}>
                {t('completion.levelUpTitle').replace('{tier}', TIER_LABEL[currentTier])}
              </div>
              <div style={{ fontSize: 13, opacity: 0.9 }}>{t('completion.levelUpBody')}</div>
            </div>
          </div>
        ) : null}

        <div style={{ background: theme.surfaceAlt, borderRadius: 14, padding: 16, marginBottom: 20 }}>
          <div style={{ color: theme.textMuted, fontSize: 11, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 8 }}>
            {t('completion.statsHeading')}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Stat label={t('completion.distance')} value={formatDistanceKm(distanceKm)} theme={theme} />
            <Stat label={t('completion.elevation')} value={formatElevation(elevationM)} theme={theme} />
          </div>
        </div>

        <div style={{ marginBottom: 20 }}>
          <div style={{ color: theme.text, fontWeight: 700, marginBottom: 8 }}>
            {t('completion.reviewExpedition')}
          </div>
          <div data-testid="rating-stars" style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setStars(n)}
                aria-label={`${n} stars`}
                style={{
                  background: 'transparent',
                  border: 0,
                  color: stars >= n ? theme.accent : theme.textMuted,
                  fontSize: 32,
                  padding: 0,
                  lineHeight: 1,
                  cursor: 'pointer',
                }}
              >
                ★
              </button>
            ))}
          </div>
          <textarea
            value={review}
            onChange={(e) => setReview(e.target.value)}
            placeholder={t('completion.reviewPlaceholder')}
            data-testid="review-body"
            style={{
              width: '100%',
              minHeight: 80,
              padding: 12,
              borderRadius: 10,
              border: `1px solid ${theme.border}`,
              background: theme.surface,
              color: theme.text,
              fontFamily: 'inherit',
              fontSize: 14,
              boxSizing: 'border-box',
              resize: 'vertical',
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button
            onClick={dismiss}
            disabled={saving}
            style={{
              background: 'transparent',
              border: `1px solid ${theme.border}`,
              color: theme.text,
              borderRadius: 999,
              padding: '10px 18px',
              fontWeight: 700,
              cursor: saving ? 'wait' : 'pointer',
            }}
          >
            {t('completion.dismiss')}
          </button>
          <button
            data-testid="completion-submit"
            onClick={submit}
            disabled={saving}
            style={{
              background: theme.primary,
              color: theme.onPrimary,
              border: 0,
              borderRadius: 999,
              padding: '10px 22px',
              fontWeight: 800,
              cursor: saving ? 'wait' : 'pointer',
            }}
          >
            {t('completion.submit')}
          </button>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, theme }: { label: string; value: string; theme: ReturnType<typeof useTheme>['theme'] }) {
  return (
    <div>
      <div style={{ color: theme.text, fontSize: 22, fontWeight: 800 }}>{value}</div>
      <div style={{ color: theme.textMuted, fontSize: 11, fontWeight: 700, letterSpacing: 0.4, textTransform: 'uppercase' }}>
        {label}
      </div>
    </div>
  );
}
