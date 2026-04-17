import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Activity, CircleDollarSign, MessageCircle, Medal } from 'lucide-react';
import { useTheme } from '@minga/theme';
import { useT } from '@minga/i18n';
import { fetchFeedExpeditions } from '@minga/supabase';
import type { ExpeditionWithAuthor } from '@minga/types';
import { supabase } from '../supabase';
import { ExpeditionTile } from '../components/ExpeditionTile';

export function HomePage() {
  const { theme } = useTheme();
  const { t } = useT();
  const [expeditions, setExpeditions] = useState<ExpeditionWithAuthor[]>([]);

  useEffect(() => {
    fetchFeedExpeditions(supabase, { limit: 6 })
      .then(setExpeditions)
      .catch(() => undefined);
  }, []);

  return (
    <>
      <section
        style={{
          background: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.accent} 100%)`,
          color: theme.onPrimary,
          padding: '80px 24px',
        }}
      >
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 40, alignItems: 'center' }}>
          <div>
            <div style={{ letterSpacing: 3, fontWeight: 700, fontSize: 14, opacity: 0.9, marginBottom: 12 }}>
              {t('home.eyebrow')}
            </div>
            <h1 style={{ fontSize: 56, lineHeight: 1.05, fontWeight: 800, margin: 0, whiteSpace: 'pre-line' }}>
              {t('home.heroTitle')}
            </h1>
            <p style={{ fontSize: 18, lineHeight: 1.5, maxWidth: 560, marginTop: 20 }}>{t('home.heroBody')}</p>
            <div style={{ display: 'flex', gap: 12, marginTop: 28, flexWrap: 'wrap' }}>
              <Link
                to="/expeditions"
                style={{
                  background: '#fff',
                  color: theme.primary,
                  padding: '14px 26px',
                  borderRadius: 999,
                  fontWeight: 800,
                  fontSize: 16,
                }}
              >
                {t('home.ctaBrowse')}
              </Link>
              <Link
                to="/map"
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  color: '#fff',
                  border: '2px solid rgba(255,255,255,0.6)',
                  padding: '12px 24px',
                  borderRadius: 999,
                  fontWeight: 800,
                  fontSize: 16,
                }}
              >
                {t('nav.map')}
              </Link>
              <Link
                to="/auth"
                style={{
                  background: 'transparent',
                  color: '#fff',
                  border: '2px solid rgba(255,255,255,0.6)',
                  padding: '12px 24px',
                  borderRadius: 999,
                  fontWeight: 800,
                  fontSize: 16,
                }}
              >
                {t('home.ctaCreate')}
              </Link>
            </div>
          </div>
          <div
            style={{
              aspectRatio: '4/3',
              borderRadius: 24,
              background:
                'url(https://images.unsplash.com/photo-1568438350562-2cae6d394ad0?w=1200) center/cover, #000',
              boxShadow: '0 30px 60px rgba(0,0,0,0.2)',
            }}
          />
        </div>
      </section>

      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '64px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <div style={{ color: theme.primary, fontWeight: 800, letterSpacing: 2, fontSize: 13 }}>
              {t('home.featuredSub')}
            </div>
            <h2 style={{ margin: '6px 0 0 0', fontSize: 36, fontWeight: 800, color: theme.text }}>
              {t('home.featured')}
            </h2>
          </div>
          <Link to="/expeditions" style={{ color: theme.primary, fontWeight: 700 }}>
            {t('common.more')}
          </Link>
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: 24,
          }}
        >
          {expeditions.map((e) => (
            <ExpeditionTile key={e.id} expedition={e} />
          ))}
        </div>
      </section>

      <section style={{ background: theme.surfaceAlt, padding: '64px 24px' }}>
        <div
          style={{
            maxWidth: 1200,
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: 32,
          }}
        >
          <Pillar Icon={Activity} title={t('home.pillarTrackingTitle')} body={t('home.pillarTrackingBody')} theme={theme} />
          <Pillar Icon={Medal} title={t('home.pillarTierTitle')} body={t('home.pillarTierBody')} theme={theme} />
          <Pillar Icon={MessageCircle} title={t('home.pillarCommunityTitle')} body={t('home.pillarCommunityBody')} theme={theme} />
          <Pillar Icon={CircleDollarSign} title={t('home.pillarMonetizeTitle')} body={t('home.pillarMonetizeBody')} theme={theme} />
        </div>
      </section>
    </>
  );
}

function Pillar({
  Icon,
  title,
  body,
  theme,
}: {
  Icon: React.ComponentType<{ size?: number; strokeWidth?: number; color?: string }>;
  title: string;
  body: string;
  theme: any;
}) {
  return (
    <div>
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: 16,
          background: theme.primaryMuted,
          color: theme.primary,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 14,
        }}
      >
        <Icon size={28} strokeWidth={2.2} />
      </div>
      <h3 style={{ color: theme.text, marginBottom: 6 }}>{title}</h3>
      <p style={{ color: theme.textMuted, lineHeight: 1.5 }}>{body}</p>
    </div>
  );
}
