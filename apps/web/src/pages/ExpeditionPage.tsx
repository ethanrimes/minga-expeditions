import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { useTheme, tierColors } from '@minga/theme';
import { useT } from '@minga/i18n';
import {
  fetchComments,
  fetchExpeditionById,
  postComment,
  rateExpedition,
  toggleLike,
} from '@minga/supabase';
import { formatDistanceKm, formatElevation, formatPriceCents, relativeTime } from '@minga/logic';
import type { CommentWithAuthor, ExpeditionWithAuthor, TierLevel } from '@minga/types';
import { supabase } from '../supabase';

const TIER_KEY: Record<TierLevel, any> = {
  bronze: 'tier.bronze',
  silver: 'tier.silver',
  gold: 'tier.gold',
  diamond: 'tier.diamond',
};

export function ExpeditionPage() {
  const { id } = useParams<{ id: string }>();
  const { theme } = useTheme();
  const { t, language } = useT();
  const [expedition, setExpedition] = useState<ExpeditionWithAuthor | null>(null);
  const [comments, setComments] = useState<CommentWithAuthor[]>([]);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [myStars, setMyStars] = useState<number>(0);

  const load = async () => {
    if (!id) return;
    try {
      const [exp, cmts] = await Promise.all([
        fetchExpeditionById(supabase, id),
        fetchComments(supabase, id),
      ]);
      setExpedition(exp);
      setComments(cmts);
    } catch (e: any) {
      setError(e?.message ?? t('common.loadError'));
    }
  };

  useEffect(() => {
    void load();
  }, [id]);

  if (error) return <Msg>{error}</Msg>;
  if (!expedition) return <Msg>{t('feed.loading')}</Msg>;

  const like = async () => {
    try {
      await toggleLike(supabase, expedition.id);
      await load();
    } catch (e: any) {
      setError(e?.message ?? t('common.signInToLike'));
    }
  };

  const rate = async (stars: 1 | 2 | 3 | 4 | 5) => {
    try {
      setMyStars(stars);
      await rateExpedition(supabase, { expedition_id: expedition.id, stars });
      await load();
    } catch (e: any) {
      setError(e?.message ?? t('common.signInToRate'));
    }
  };

  const post = async (parentId: string | null, body: string) => {
    if (!body.trim()) return;
    try {
      await postComment(supabase, { expedition_id: expedition.id, body: body.trim(), parent_id: parentId });
      setDraft('');
      await load();
    } catch (e: any) {
      setError(e?.message ?? t('common.signInToComment'));
    }
  };

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px' }}>
      <Link to="/expeditions" style={{ color: theme.primary, fontWeight: 700 }}>
        ← {t('common.allExpeditions')}
      </Link>
      <h1 style={{ color: theme.text, fontSize: 44, fontWeight: 800, margin: '12px 0 6px 0' }}>
        {expedition.title}
      </h1>
      <div style={{ color: theme.textMuted, fontSize: 16, marginBottom: 24 }}>
        {expedition.location_name}
        {expedition.region ? `, ${expedition.region}` : ''}, {expedition.country}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16, marginBottom: 32 }}>
        {expedition.photos.map((p) => (
          <figure key={p.id} style={{ margin: 0, borderRadius: 16, overflow: 'hidden', background: theme.surfaceAlt }}>
            <img src={p.url} alt={p.caption ?? ''} style={{ width: '100%', aspectRatio: '4/3', objectFit: 'cover' }} />
            {p.attribution ? (
              <figcaption style={{ padding: '8px 12px', fontSize: 12, color: theme.textMuted }}>
                {t('detail.photoBy')} © {p.attribution.photographer_name} ·{' '}
                <a href={p.attribution.source_url} target="_blank" rel="noopener" style={{ color: theme.primary }}>
                  {p.attribution.license}
                </a>
              </figcaption>
            ) : null}
          </figure>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 32 }}>
        <div>
          <div
            style={{
              display: 'flex',
              gap: 12,
              padding: 20,
              background: theme.surfaceAlt,
              borderRadius: 16,
              marginBottom: 24,
            }}
          >
            <Stat theme={theme} label={t('stats.distance')} value={expedition.distance_km ? formatDistanceKm(expedition.distance_km) : '—'} />
            <Stat theme={theme} label={t('stats.elevation')} value={expedition.elevation_gain_m ? formatElevation(expedition.elevation_gain_m) : '—'} />
            <Stat
              theme={theme}
              label={t('stats.difficulty')}
              value={`${'●'.repeat(expedition.difficulty)}${'○'.repeat(5 - expedition.difficulty)}`}
            />
            <Stat
              theme={theme}
              label={t('stats.price')}
              value={formatPriceCents(expedition.price_cents, { currency: expedition.currency, freeLabel: t('common.free') })}
            />
          </div>

          <p style={{ color: theme.text, fontSize: 16, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
            {expedition.description}
          </p>

          <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginTop: 20 }}>
            <button
              onClick={like}
              style={{
                background: theme.surface,
                color: theme.text,
                border: `1px solid ${theme.border}`,
                padding: '10px 18px',
                borderRadius: 999,
                fontWeight: 700,
              }}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <Heart size={16} strokeWidth={2.2} /> {expedition.likes_count}
              </span>
            </button>
            <StarPicker value={Math.max(myStars, Math.round(expedition.avg_rating ?? 0))} onPick={rate} color={theme.accent} muted={theme.textMuted} />
            <span style={{ color: theme.textMuted, fontSize: 14 }}>
              {expedition.avg_rating ? `${expedition.avg_rating.toFixed(1)} ${t('detail.avgRating')}` : t('detail.notRated')}
            </span>
          </div>

          <h2 style={{ color: theme.text, marginTop: 40, marginBottom: 16 }}>
            {t('detail.comments')} ({expedition.comments_count})
          </h2>

          <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={t('detail.commentPlaceholder')}
              style={{
                flex: 1,
                padding: 12,
                borderRadius: 12,
                border: `1px solid ${theme.border}`,
                background: theme.surface,
                color: theme.text,
                minHeight: 72,
                resize: 'vertical',
              }}
            />
            <button
              onClick={() => post(null, draft)}
              style={{
                background: theme.primary,
                color: theme.onPrimary,
                border: 0,
                borderRadius: 12,
                padding: '0 20px',
                fontWeight: 700,
                alignSelf: 'stretch',
              }}
            >
              {t('detail.post')}
            </button>
          </div>

          <CommentList
            comments={comments}
            onReply={(parentId, body) => post(parentId, body)}
            theme={theme}
            t={t}
            language={language}
          />
        </div>

        <aside>
          <div
            style={{
              background: theme.surface,
              border: `1px solid ${theme.border}`,
              borderRadius: 16,
              padding: 20,
              display: 'flex',
              gap: 12,
              alignItems: 'center',
            }}
          >
            {expedition.author.avatar_url ? (
              <img
                src={expedition.author.avatar_url}
                alt={t('profile.avatarAlt')}
                style={{ width: 52, height: 52, borderRadius: 999, background: theme.surfaceAlt }}
              />
            ) : null}
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, color: theme.text }}>{expedition.author.display_name}</div>
              <div style={{ color: theme.textMuted, fontSize: 14 }}>@{expedition.author.username}</div>
            </div>
            <span
              style={{
                background: tierColors[expedition.author.tier],
                color: '#fff',
                padding: '4px 10px',
                borderRadius: 999,
                fontSize: 11,
                fontWeight: 800,
              }}
            >
              {t(TIER_KEY[expedition.author.tier])}
            </span>
          </div>
        </aside>
      </div>
    </div>
  );
}

function CommentList({
  comments,
  onReply,
  theme,
  t,
  language,
  depth = 0,
}: {
  comments: CommentWithAuthor[];
  onReply: (parentId: string, body: string) => Promise<void> | void;
  theme: any;
  t: (key: any) => string;
  language: string;
  depth?: number;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginLeft: depth > 0 ? 24 : 0 }}>
      {comments.map((c) => (
        <CommentNode key={c.id} comment={c} onReply={onReply} theme={theme} t={t} language={language} depth={depth} />
      ))}
    </div>
  );
}

function CommentNode({
  comment,
  onReply,
  theme,
  t,
  language,
  depth,
}: {
  comment: CommentWithAuthor;
  onReply: (parentId: string, body: string) => Promise<void> | void;
  theme: any;
  t: (key: any) => string;
  language: string;
  depth: number;
}) {
  const [replyDraft, setReplyDraft] = useState('');
  const [open, setOpen] = useState(false);
  return (
    <div
      style={{
        background: theme.surface,
        border: `1px solid ${theme.border}`,
        borderRadius: 14,
        padding: 16,
      }}
    >
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 8 }}>
        {comment.author.avatar_url ? (
          <img
            src={comment.author.avatar_url}
            alt=""
            style={{ width: 32, height: 32, borderRadius: 999, background: theme.surfaceAlt }}
          />
        ) : null}
        <div style={{ flex: 1 }}>
          <div style={{ color: theme.text, fontWeight: 700, fontSize: 14 }}>{comment.author.display_name}</div>
          <div style={{ color: theme.textMuted, fontSize: 12 }}>{relativeTime(comment.created_at, language)}</div>
        </div>
        <span
          style={{
            background: tierColors[comment.author.tier],
            color: '#fff',
            padding: '2px 8px',
            borderRadius: 999,
            fontSize: 10,
            fontWeight: 800,
          }}
        >
          {t(TIER_KEY[comment.author.tier])}
        </span>
      </div>
      <div style={{ color: theme.text, lineHeight: 1.5 }}>{comment.body}</div>
      {depth < 2 ? (
        <button
          onClick={() => setOpen((o) => !o)}
          style={{
            background: 'transparent',
            border: 0,
            color: theme.primary,
            fontWeight: 700,
            padding: '6px 0',
            marginTop: 8,
          }}
        >
          {open ? t('detail.cancel') : t('detail.reply')}
        </button>
      ) : null}
      {open ? (
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <input
            value={replyDraft}
            onChange={(e) => setReplyDraft(e.target.value)}
            placeholder={t('detail.replyPlaceholder')}
            style={{
              flex: 1,
              padding: 10,
              borderRadius: 10,
              border: `1px solid ${theme.border}`,
              background: theme.surface,
              color: theme.text,
            }}
          />
          <button
            onClick={async () => {
              await onReply(comment.id, replyDraft);
              setReplyDraft('');
              setOpen(false);
            }}
            style={{
              background: theme.primary,
              color: theme.onPrimary,
              border: 0,
              borderRadius: 10,
              padding: '0 16px',
              fontWeight: 700,
            }}
          >
            {t('detail.post')}
          </button>
        </div>
      ) : null}
      {comment.replies && comment.replies.length > 0 ? (
        <div style={{ marginTop: 12 }}>
          <CommentList comments={comment.replies} onReply={onReply} theme={theme} t={t} language={language} depth={depth + 1} />
        </div>
      ) : null}
    </div>
  );
}

function StarPicker({
  value,
  onPick,
  color,
  muted,
}: {
  value: number;
  onPick: (stars: 1 | 2 | 3 | 4 | 5) => void;
  color: string;
  muted: string;
}) {
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          onClick={() => onPick(n as 1 | 2 | 3 | 4 | 5)}
          style={{
            background: 'transparent',
            border: 0,
            color: value >= n ? color : muted,
            fontSize: 22,
            padding: 0,
            cursor: 'pointer',
          }}
        >
          ★
        </button>
      ))}
    </div>
  );
}

function Stat({ theme, label, value }: { theme: any; label: string; value: string }) {
  return (
    <div style={{ flex: 1 }}>
      <div style={{ color: theme.text, fontWeight: 700, fontSize: 16 }}>{value}</div>
      <div style={{ color: theme.textMuted, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</div>
    </div>
  );
}

function Msg({ children }: { children: React.ReactNode }) {
  return <div style={{ maxWidth: 900, margin: '0 auto', padding: '40px 24px' }}>{children}</div>;
}
