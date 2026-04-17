import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTheme, tierColors } from '@minga/theme';
import { useT } from '@minga/i18n';
import { fetchMyActivities, fetchProfile } from '@minga/supabase';
import { formatDistanceKm, formatDuration, formatElevation, progressToNextTier, TIER_THRESHOLDS_KM } from '@minga/logic';
import type { ActivityType, DbActivity, DbProfile, TierLevel } from '@minga/types';
import { supabase } from '../supabase';

const TIER_KEY: Record<TierLevel, any> = {
  bronze: 'tier.bronze',
  silver: 'tier.silver',
  gold: 'tier.gold',
  diamond: 'tier.diamond',
};

const ACT_KEY: Record<ActivityType, any> = {
  hike: 'track.actType.hike',
  ride: 'track.actType.ride',
  run: 'track.actType.run',
  walk: 'track.actType.walk',
};

export function ProfilePage() {
  const { theme } = useTheme();
  const { t, language } = useT();
  const [profile, setProfile] = useState<DbProfile | null>(null);
  const [activities, setActivities] = useState<DbActivity[]>([]);
  const [email, setEmail] = useState<string | null>(null);
  const [signedIn, setSignedIn] = useState<boolean>(false);
  const locale = language === 'es' ? 'es-CO' : 'en-US';

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        setSignedIn(false);
        return;
      }
      setSignedIn(true);
      setEmail(data.user.email ?? null);
      const [p, a] = await Promise.all([fetchProfile(supabase, data.user.id), fetchMyActivities(supabase)]);
      setProfile(p);
      setActivities(a);
    })();
  }, []);

  if (!signedIn) {
    return (
      <div style={{ maxWidth: 600, margin: '80px auto', padding: '0 24px', textAlign: 'center' }}>
        <div style={{ fontSize: 60 }}>👤</div>
        <h1 style={{ color: theme.text }}>{t('profile.signInTitle')}</h1>
        <p style={{ color: theme.textMuted }}>{t('profile.signInBody')}</p>
        <Link
          to="/auth"
          style={{
            display: 'inline-block',
            background: theme.primary,
            color: theme.onPrimary,
            padding: '14px 28px',
            borderRadius: 999,
            fontWeight: 800,
          }}
        >
          {t('auth.signIn')}
        </Link>
      </div>
    );
  }

  const progress = progressToNextTier(profile?.total_distance_km ?? 0);

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 24px' }}>
      <div style={{ display: 'flex', gap: 24, alignItems: 'center', marginBottom: 32 }}>
        {profile?.avatar_url ? (
          <img
            src={profile.avatar_url}
            alt={t('profile.avatarAlt')}
            style={{ width: 96, height: 96, borderRadius: 999, background: theme.surfaceAlt }}
          />
        ) : (
          <div
            style={{
              width: 96,
              height: 96,
              borderRadius: 999,
              background: theme.primaryMuted,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: theme.primary,
              fontWeight: 800,
              fontSize: 32,
            }}
          >
            {(profile?.display_name ?? email ?? '?')[0]?.toUpperCase()}
          </div>
        )}
        <div style={{ flex: 1 }}>
          <h1 style={{ color: theme.text, margin: 0 }}>{profile?.display_name ?? email}</h1>
          <div style={{ color: theme.textMuted }}>@{profile?.username ?? email?.split('@')[0]}</div>
          {profile ? (
            <span
              style={{
                display: 'inline-block',
                marginTop: 8,
                background: tierColors[profile.tier],
                color: '#fff',
                padding: '4px 12px',
                borderRadius: 999,
                fontWeight: 800,
                fontSize: 12,
                letterSpacing: 1,
              }}
            >
              {t(TIER_KEY[profile.tier])}
            </span>
          ) : null}
        </div>
      </div>

      {profile ? (
        <section
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 16,
            marginBottom: 32,
          }}
        >
          <Stat theme={theme} label={t('stats.totalKm')} value={formatDistanceKm(profile.total_distance_km)} />
          <Stat theme={theme} label={t('stats.totalElevation')} value={formatElevation(profile.total_elevation_m)} />
          <Stat theme={theme} label={t('stats.activities')} value={String(activities.length)} />
        </section>
      ) : null}

      {profile ? (
        <section
          style={{
            background: theme.surfaceAlt,
            borderRadius: 16,
            padding: 24,
            marginBottom: 32,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <strong style={{ color: theme.text }}>
              {t(TIER_KEY[profile.tier])}
              {progress.next ? ` → ${t(TIER_KEY[progress.next])}` : ` · ${t('tier.maxTier')}`}
            </strong>
            <span style={{ color: theme.textMuted }}>{formatDistanceKm(profile.total_distance_km)}</span>
          </div>
          <div style={{ height: 12, background: '#fff', borderRadius: 999, overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                width: `${Math.round(progress.pct * 100)}%`,
                background: tierColors[progress.next ?? profile.tier],
              }}
            />
          </div>
          {progress.next ? (
            <div style={{ color: theme.textMuted, fontSize: 13, marginTop: 8 }}>
              {formatDistanceKm(progress.remainingKm)} {t('profile.tierToGo')} {t(TIER_KEY[progress.next])} ({t('tier.thresholdSuffix')}{' '}
              {formatDistanceKm(TIER_THRESHOLDS_KM[progress.next])}).
            </div>
          ) : null}
        </section>
      ) : null}

      <h2 style={{ color: theme.text, marginTop: 0 }}>{t('profile.recentActivities')}</h2>
      {activities.length === 0 ? (
        <div style={{ color: theme.textMuted }}>
          {t('profile.emptyActivities')}{' '}
          <Link to="/track" style={{ color: theme.primary, fontWeight: 700 }}>
            {t('profile.emptyActivitiesCta')}
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {activities.map((a) => (
            <Link
              key={a.id}
              to={`/activities/${a.id}`}
              style={{
                textDecoration: 'none',
                background: theme.surface,
                border: `1px solid ${theme.border}`,
                borderRadius: 14,
                padding: 18,
                display: 'grid',
                gridTemplateColumns: '2fr 1fr 1fr 1fr',
                gap: 12,
                alignItems: 'center',
                transition: 'transform 120ms ease, box-shadow 120ms ease',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(-2px)';
                (e.currentTarget as HTMLAnchorElement).style.boxShadow = '0 8px 18px rgba(0,0,0,0.06)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(0)';
                (e.currentTarget as HTMLAnchorElement).style.boxShadow = 'none';
              }}
            >
              <div>
                <strong style={{ color: theme.text }}>{a.title}</strong>
                <div style={{ color: theme.textMuted, fontSize: 13 }}>
                  {t(ACT_KEY[a.activity_type])} · {new Date(a.started_at).toLocaleDateString(locale)}
                </div>
              </div>
              <Stat theme={theme} label={t('stats.distance')} value={formatDistanceKm(a.distance_km)} small />
              <Stat theme={theme} label={t('stats.elevation')} value={formatElevation(a.elevation_gain_m)} small />
              <Stat theme={theme} label={t('stats.duration')} value={formatDuration(a.duration_seconds)} small />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function Stat({ theme, label, value, small }: { theme: any; label: string; value: string; small?: boolean }) {
  return (
    <div
      style={{
        background: small ? 'transparent' : theme.surfaceAlt,
        borderRadius: small ? 0 : 16,
        padding: small ? 0 : 20,
      }}
    >
      <div style={{ color: theme.text, fontSize: small ? 16 : 24, fontWeight: 800 }}>{value}</div>
      <div style={{ color: theme.textMuted, fontSize: 11, letterSpacing: 0.5, textTransform: 'uppercase' }}>
        {label}
      </div>
    </div>
  );
}
