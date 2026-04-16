import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '@minga/theme';
import { fetchFeedExpeditions } from '@minga/supabase';
import type { ExpeditionWithAuthor } from '@minga/types';
import { supabase } from '../supabase';
import { ExpeditionTile } from '../components/ExpeditionTile';

export function HomePage() {
  const { theme } = useTheme();
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
              CONNECT · TRACK · CELEBRATE
            </div>
            <h1 style={{ fontSize: 56, lineHeight: 1.05, fontWeight: 800, margin: 0 }}>
              Every trail in Colombia,
              <br />in one happy app.
            </h1>
            <p style={{ fontSize: 18, lineHeight: 1.5, maxWidth: 560, marginTop: 20 }}>
              Minga Expeditions turns your hikes, rides, and cultural visits into a shared journey.
              Track kilometers and climbs, earn tier badges, and discover expeditions from locals
              and the Minga team across Colombia.
            </p>
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
                Browse expeditions
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
                Create account
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
              FEATURED EXPEDITIONS
            </div>
            <h2 style={{ margin: '6px 0 0 0', fontSize: 36, fontWeight: 800, color: theme.text }}>
              Start your next story
            </h2>
          </div>
          <Link to="/expeditions" style={{ color: theme.primary, fontWeight: 700 }}>
            See all →
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
          <Pillar
            icon="📍"
            title="Real-time tracking"
            body="GPS-recorded hikes and rides, with elevation, pace, and route history — just like Strava."
            theme={theme}
          />
          <Pillar
            icon="🏅"
            title="Earn your tier"
            body="Rack up kilometers to progress from Bronze to Diamond. Every trail counts."
            theme={theme}
          />
          <Pillar
            icon="💬"
            title="Travel community"
            body="Comment threads, likes, and ratings on every expedition — local tips straight from travelers."
            theme={theme}
          />
          <Pillar
            icon="💸"
            title="Monetize your own"
            body="List your expedition, charge a small fee, and let Minga travelers discover it."
            theme={theme}
          />
        </div>
      </section>
    </>
  );
}

function Pillar({ icon, title, body, theme }: { icon: string; title: string; body: string; theme: any }) {
  return (
    <div>
      <div style={{ fontSize: 40 }}>{icon}</div>
      <h3 style={{ color: theme.text, marginBottom: 6 }}>{title}</h3>
      <p style={{ color: theme.textMuted, lineHeight: 1.5 }}>{body}</p>
    </div>
  );
}
