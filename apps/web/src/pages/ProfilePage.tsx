import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { User as UserIcon } from 'lucide-react';
import { useTheme, tierColors } from '@minga/theme';
import { useT } from '@minga/i18n';
import { fetchMyActivities, fetchProfile, updateMyProfile, uploadAvatar } from '@minga/supabase';
import { formatDistanceKm, formatDuration, formatElevation, progressToNextTier, TIER_THRESHOLDS_KM } from '@minga/logic';
import type { ActivityType, DbActivity, DbProfile, TierLevel } from '@minga/types';
import { supabase } from '../supabase';

const COUNTRY_CODES: { code: string; label: string }[] = [
  { code: '+57', label: '🇨🇴 +57' },
  { code: '+1', label: '🇺🇸 +1' },
  { code: '+52', label: '🇲🇽 +52' },
  { code: '+593', label: '🇪🇨 +593' },
  { code: '+51', label: '🇵🇪 +51' },
  { code: '+56', label: '🇨🇱 +56' },
  { code: '+54', label: '🇦🇷 +54' },
  { code: '+55', label: '🇧🇷 +55' },
  { code: '+58', label: '🇻🇪 +58' },
  { code: '+591', label: '🇧🇴 +591' },
  { code: '+34', label: '🇪🇸 +34' },
  { code: '+44', label: '🇬🇧 +44' },
  { code: '+49', label: '🇩🇪 +49' },
  { code: '+33', label: '🇫🇷 +33' },
];

const PROVIDER_META: Record<string, { label: string; emoji: string }> = {
  email: { label: 'Email + password', emoji: '✉️' },
  facebook: { label: 'Facebook', emoji: '📘' },
  google: { label: 'Google', emoji: '🔵' },
  apple: { label: 'Apple', emoji: '🍎' },
  github: { label: 'GitHub', emoji: '🐙' },
  anonymous: { label: 'Guest session', emoji: '👻' },
};

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
  const [userId, setUserId] = useState<string | null>(null);
  // Identities the user has linked via Supabase auth providers. Order is
  // preserved from supabase-js — typically the signup provider is first.
  const [identityProviders, setIdentityProviders] = useState<string[]>([]);
  const [displayName, setDisplayName] = useState<string>('');
  const [nameSaveState, setNameSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [instagramHandle, setInstagramHandle] = useState<string>('');
  const [igSaveState, setIgSaveState] = useState<'idle' | 'saving' | 'saved' | 'error' | 'invalid'>('idle');
  const [avatarState, setAvatarState] = useState<'idle' | 'uploading' | 'error'>('idle');
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [phoneCode, setPhoneCode] = useState<string>('+57');
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  // Snapshot of what's currently saved (verified) on the profile. Lets us
  // compare against the input to know if the user is still on the verified
  // number or has edited away from it.
  const [savedPhoneE164, setSavedPhoneE164] = useState<string | null>(null);
  const [phoneVerifiedAt, setPhoneVerifiedAt] = useState<string | null>(null);
  // OTP flow state.
  const [otpState, setOtpState] = useState<'idle' | 'sending' | 'code' | 'verifying'>('idle');
  const [otpCode, setOtpCode] = useState<string>('');
  const [otpError, setOtpError] = useState<string | null>(null);
  const [otpSentTo, setOtpSentTo] = useState<string | null>(null);
  const locale = language === 'es' ? 'es-CO' : 'en-US';

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        setSignedIn(false);
        return;
      }
      setSignedIn(true);
      setUserId(data.user.id);
      setEmail(data.user.email ?? null);
      // identities lives on the user object when Supabase populates it.
      // Falls back to app_metadata.providers when identities is missing.
      const identities = (data.user.identities ?? []) as Array<{ provider: string }>;
      const providers = identities.length
        ? identities.map((i) => i.provider)
        : ((data.user.app_metadata?.providers as string[] | undefined) ?? []);
      setIdentityProviders(Array.from(new Set(providers)));
      const [p, a, phoneRow] = await Promise.all([
        fetchProfile(supabase, data.user.id),
        fetchMyActivities(supabase),
        supabase
          .from('profiles')
          .select('phone_country_code, phone_number, phone_verified_at, instagram_handle')
          .eq('id', data.user.id)
          .maybeSingle(),
      ]);
      setProfile(p);
      if (p?.display_name) setDisplayName(p.display_name);
      setActivities(a);
      const ph = phoneRow.data as {
        phone_country_code: string | null;
        phone_number: string | null;
        phone_verified_at: string | null;
        instagram_handle: string | null;
      } | null;
      if (ph?.phone_country_code) setPhoneCode(ph.phone_country_code);
      if (ph?.phone_number) setPhoneNumber(ph.phone_number);
      if (ph?.phone_country_code && ph?.phone_number) {
        setSavedPhoneE164(`${ph.phone_country_code}${ph.phone_number}`);
      }
      setPhoneVerifiedAt(ph?.phone_verified_at ?? null);
      if (ph?.instagram_handle) setInstagramHandle(ph.instagram_handle);
    })();
  }, []);

  const saveDisplayName = async () => {
    if (!userId) return;
    const trimmed = displayName.trim();
    if (!trimmed || trimmed === profile?.display_name) return;
    setNameSaveState('saving');
    try {
      const updated = await updateMyProfile(supabase, { display_name: trimmed });
      setProfile(updated);
      setDisplayName(updated.display_name);
      setNameSaveState('saved');
      setTimeout(() => setNameSaveState('idle'), 2000);
    } catch {
      setNameSaveState('error');
    }
  };

  const saveInstagram = async () => {
    if (!userId) return;
    const normalized = instagramHandle.replace(/^@+/, '').trim().toLowerCase();
    if (normalized && !/^[a-z0-9._]{1,30}$/.test(normalized)) {
      setIgSaveState('invalid');
      return;
    }
    setIgSaveState('saving');
    try {
      const updated = await updateMyProfile(supabase, { instagram_handle: normalized });
      setProfile(updated);
      setInstagramHandle(normalized);
      setIgSaveState('saved');
      setTimeout(() => setIgSaveState('idle'), 2000);
    } catch {
      setIgSaveState('error');
    }
  };

  const onAvatarFile = async (file: File) => {
    if (!userId) return;
    setAvatarState('uploading');
    try {
      const url = await uploadAvatar(supabase, file, file.name);
      const updated = await updateMyProfile(supabase, { avatar_url: url });
      setProfile(updated);
      setAvatarState('idle');
    } catch {
      setAvatarState('error');
    }
  };

  // Compose the current input as E.164 for comparison + send.
  const currentE164 = `${phoneCode}${phoneNumber.replace(/\D/g, '')}`;
  const phoneIsVerified =
    !!phoneVerifiedAt && !!savedPhoneE164 && savedPhoneE164 === currentE164;

  const sendOtp = async () => {
    if (!userId) return;
    setOtpError(null);
    setOtpState('sending');
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData.session?.access_token;
    const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/whatsapp-otp-send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ phone_e164: currentE164 }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      setOtpError(json.error ?? 'Could not send verification code.');
      setOtpState('idle');
      return;
    }
    setOtpSentTo(currentE164);
    setOtpCode('');
    setOtpState('code');
  };

  const verifyOtp = async () => {
    if (!userId || !otpSentTo) return;
    setOtpError(null);
    setOtpState('verifying');
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData.session?.access_token;
    const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/whatsapp-otp-verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ phone_e164: otpSentTo, code: otpCode }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      setOtpError(json.error ?? 'Could not verify code.');
      setOtpState('code');
      return;
    }
    setPhoneVerifiedAt(json.phone_verified_at ?? new Date().toISOString());
    setSavedPhoneE164(otpSentTo);
    setOtpState('idle');
    setOtpSentTo(null);
    setOtpCode('');
  };

  if (!signedIn) {
    return (
      <div style={{ maxWidth: 600, margin: '80px auto', padding: '0 24px', textAlign: 'center' }}>
        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: 999,
            background: theme.primaryMuted,
            color: theme.primary,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
          }}
        >
          <UserIcon size={44} strokeWidth={2} />
        </div>
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
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          {profile?.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={t('profile.avatarAlt')}
              style={{ width: 96, height: 96, borderRadius: 999, background: theme.surfaceAlt, objectFit: 'cover' }}
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
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void onAvatarFile(f);
              e.currentTarget.value = '';
            }}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={avatarState === 'uploading'}
            style={{
              background: theme.surfaceAlt,
              color: theme.text,
              border: `1px solid ${theme.border}`,
              borderRadius: 999,
              padding: '6px 12px',
              fontWeight: 700,
              fontSize: 12,
              cursor: avatarState === 'uploading' ? 'wait' : 'pointer',
              opacity: avatarState === 'uploading' ? 0.7 : 1,
            }}
          >
            {avatarState === 'uploading'
              ? t('profile.uploadingPhoto')
              : avatarState === 'error'
                ? t('profile.uploadFailed')
                : t('profile.changePhoto')}
          </button>
        </div>
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

      <section
        style={{
          background: theme.surface,
          border: `1px solid ${theme.border}`,
          borderRadius: 16,
          padding: 24,
          marginBottom: 32,
        }}
      >
        <label style={{ display: 'block', color: theme.text, fontWeight: 700, marginBottom: 4 }}>
          {t('profile.displayNameLabel')}
        </label>
        <div style={{ color: theme.textMuted, fontSize: 13, marginBottom: 10 }}>
          {t('profile.displayNameHelp')}
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            onBlur={() => void saveDisplayName()}
            maxLength={80}
            style={{
              background: theme.surfaceAlt,
              color: theme.text,
              border: `1px solid ${theme.border}`,
              borderRadius: 10,
              padding: '10px 12px',
              fontSize: 14,
              flex: '1 1 240px',
              minWidth: 200,
            }}
          />
          {nameSaveState !== 'idle' ? (
            <span style={{ color: nameSaveState === 'error' ? theme.danger : theme.textMuted, fontSize: 13 }}>
              {nameSaveState === 'saving'
                ? t('profile.phoneSaving')
                : nameSaveState === 'saved'
                  ? t('profile.phoneSaved')
                  : t('profile.phoneRetry')}
            </span>
          ) : null}
        </div>
      </section>

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

      <section
        style={{
          background: theme.surface,
          border: `1px solid ${theme.border}`,
          borderRadius: 16,
          padding: 24,
          marginBottom: 32,
        }}
      >
        <h2 style={{ color: theme.text, margin: '0 0 16px' }}>Connected accounts</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <ContactRow theme={theme} icon="✉️" label="Email" value={email ?? '—'} hint="From your account" />
          <ContactRow
            theme={theme}
            icon="🔐"
            label="Sign-in method"
            value={
              identityProviders.length
                ? identityProviders
                    .map((p) => PROVIDER_META[p]?.label ?? p)
                    .join(' · ')
                : 'Email + password'
            }
            hint={
              identityProviders.includes('facebook') || identityProviders.includes('google')
                ? 'OAuth-linked at signup'
                : 'Linked OAuth providers will show here'
            }
          />
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
              padding: '12px 0',
              borderTop: `1px solid ${theme.border}`,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 20, lineHeight: 1 }}>💬</span>
              <div style={{ flex: 1 }}>
                <div style={{ color: theme.text, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                  WhatsApp
                  {phoneIsVerified ? (
                    <span
                      style={{
                        background: '#10b981',
                        color: '#fff',
                        fontSize: 11,
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: 999,
                        letterSpacing: 0.3,
                      }}
                    >
                      ✓ VERIFIED
                    </span>
                  ) : null}
                </div>
                <div style={{ color: theme.textMuted, fontSize: 12 }}>
                  {phoneIsVerified
                    ? `Verified ${new Date(phoneVerifiedAt!).toLocaleDateString(locale)}. Used for booking confirmations.`
                    : 'Verify your number to receive WhatsApp booking confirmations.'}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <select
                value={phoneCode}
                onChange={(e) => {
                  setPhoneCode(e.target.value);
                  setOtpState('idle');
                  setOtpSentTo(null);
                }}
                disabled={otpState !== 'idle'}
                style={{
                  background: theme.surfaceAlt,
                  color: theme.text,
                  border: `1px solid ${theme.border}`,
                  borderRadius: 10,
                  padding: '10px',
                  fontSize: 14,
                  minWidth: 110,
                  opacity: otpState === 'idle' ? 1 : 0.6,
                }}
              >
                {COUNTRY_CODES.map((c) => (
                  <option key={c.code} value={c.code}>{c.label}</option>
                ))}
              </select>
              <input
                value={phoneNumber}
                onChange={(e) => {
                  setPhoneNumber(e.target.value.replace(/\D/g, ''));
                  setOtpState('idle');
                  setOtpSentTo(null);
                }}
                disabled={otpState !== 'idle'}
                type="tel"
                placeholder="3001234567"
                style={{
                  background: theme.surfaceAlt,
                  color: theme.text,
                  border: `1px solid ${theme.border}`,
                  borderRadius: 10,
                  padding: '10px 12px',
                  fontSize: 14,
                  flex: 1,
                  opacity: otpState === 'idle' ? 1 : 0.6,
                }}
              />
              {otpState === 'idle' && !phoneIsVerified ? (
                <button
                  type="button"
                  onClick={() => void sendOtp()}
                  disabled={!phoneNumber.replace(/\D/g, '')}
                  style={{
                    background: theme.primary,
                    color: theme.onPrimary,
                    border: 0,
                    borderRadius: 999,
                    padding: '10px 18px',
                    fontWeight: 700,
                    fontSize: 13,
                    cursor: phoneNumber.replace(/\D/g, '') ? 'pointer' : 'not-allowed',
                    opacity: phoneNumber.replace(/\D/g, '') ? 1 : 0.5,
                    whiteSpace: 'nowrap',
                  }}
                >
                  Send code
                </button>
              ) : null}
              {otpState === 'sending' ? (
                <span style={{ color: theme.textMuted, fontSize: 13 }}>Sending…</span>
              ) : null}
            </div>
            {otpState === 'code' ? (
              <div
                style={{
                  background: theme.surfaceAlt,
                  border: `1px solid ${theme.border}`,
                  borderRadius: 12,
                  padding: 14,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                }}
              >
                <div style={{ color: theme.text, fontSize: 13 }}>
                  We sent a 6-digit code to <strong>{otpSentTo}</strong>. Enter it below to verify the number.
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    type="tel"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    placeholder="123456"
                    autoFocus
                    style={{
                      background: theme.surface,
                      color: theme.text,
                      border: `1px solid ${theme.border}`,
                      borderRadius: 10,
                      padding: '10px 12px',
                      fontSize: 18,
                      letterSpacing: 6,
                      width: 130,
                      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => void verifyOtp()}
                    disabled={otpCode.length < 6}
                    style={{
                      background: theme.primary,
                      color: theme.onPrimary,
                      border: 0,
                      borderRadius: 999,
                      padding: '10px 18px',
                      fontWeight: 700,
                      fontSize: 13,
                      cursor: otpCode.length >= 6 ? 'pointer' : 'not-allowed',
                      opacity: otpCode.length >= 6 ? 1 : 0.5,
                    }}
                  >
                    Verify
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setOtpState('idle');
                      setOtpSentTo(null);
                      setOtpCode('');
                      setOtpError(null);
                    }}
                    style={{
                      background: 'transparent',
                      color: theme.textMuted,
                      border: 0,
                      fontSize: 13,
                      cursor: 'pointer',
                      textDecoration: 'underline',
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : null}
            {otpState === 'verifying' ? (
              <div style={{ color: theme.textMuted, fontSize: 13 }}>Verifying…</div>
            ) : null}
            {otpError ? (
              <div style={{ color: theme.danger, fontSize: 13 }}>{otpError}</div>
            ) : null}
          </div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
              padding: '12px 0',
              borderTop: `1px solid ${theme.border}`,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 20, lineHeight: 1 }}>📸</span>
              <div style={{ flex: 1 }}>
                <div style={{ color: theme.text, fontWeight: 700 }}>{t('profile.instagramLabel')}</div>
                <div style={{ color: theme.textMuted, fontSize: 12 }}>{t('profile.instagramHelp')}</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'stretch', flex: '1 1 220px', minWidth: 200 }}>
                <span
                  style={{
                    background: theme.surfaceAlt,
                    color: theme.textMuted,
                    border: `1px solid ${theme.border}`,
                    borderRight: 'none',
                    borderRadius: '10px 0 0 10px',
                    padding: '10px 12px',
                    fontSize: 14,
                  }}
                >
                  @
                </span>
                <input
                  value={instagramHandle}
                  onChange={(e) => {
                    setInstagramHandle(e.target.value.replace(/^@+/, '').toLowerCase());
                    if (igSaveState === 'invalid') setIgSaveState('idle');
                  }}
                  type="text"
                  maxLength={30}
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  placeholder={t('profile.instagramPlaceholder')}
                  style={{
                    background: theme.surfaceAlt,
                    color: theme.text,
                    border: `1px solid ${theme.border}`,
                    borderRadius: '0 10px 10px 0',
                    padding: '10px 12px',
                    fontSize: 14,
                    flex: 1,
                  }}
                />
              </div>
              <button
                type="button"
                onClick={() => void saveInstagram()}
                disabled={igSaveState === 'saving'}
                style={{
                  background: igSaveState === 'saved' ? theme.surfaceAlt : theme.primary,
                  color: igSaveState === 'saved' ? theme.text : theme.onPrimary,
                  border: igSaveState === 'saved' ? `1px solid ${theme.border}` : 0,
                  borderRadius: 999,
                  padding: '10px 18px',
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: igSaveState === 'saving' ? 'wait' : 'pointer',
                  opacity: igSaveState === 'saving' ? 0.7 : 1,
                  whiteSpace: 'nowrap',
                }}
              >
                {igSaveState === 'saving'
                  ? t('profile.phoneSaving')
                  : igSaveState === 'saved'
                    ? t('profile.phoneSaved')
                    : igSaveState === 'error' || igSaveState === 'invalid'
                      ? t('profile.phoneRetry')
                      : t('profile.phoneSave')}
              </button>
              {instagramHandle && profile?.instagram_handle === instagramHandle ? (
                <a
                  href={`https://instagram.com/${instagramHandle}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: theme.primary, fontWeight: 700, fontSize: 13 }}
                >
                  {t('profile.instagramOpen')}
                </a>
              ) : null}
            </div>
            {igSaveState === 'invalid' ? (
              <div style={{ color: theme.danger, fontSize: 13 }}>{t('profile.instagramInvalid')}</div>
            ) : null}
          </div>
        </div>
      </section>

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

function ContactRow({
  theme,
  icon,
  label,
  value,
  hint,
}: {
  theme: any;
  icon: string;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <span style={{ fontSize: 20, lineHeight: 1 }}>{icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ color: theme.text, fontWeight: 700 }}>{label}</div>
        <div
          style={{
            color: theme.text,
            fontSize: 14,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {value}
        </div>
        {hint ? (
          <div style={{ color: theme.textMuted, fontSize: 12 }}>{hint}</div>
        ) : null}
      </div>
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
