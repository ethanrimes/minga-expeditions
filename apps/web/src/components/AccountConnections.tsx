import React, { useEffect, useRef, useState } from 'react';
import { Mail, MessageCircle } from 'lucide-react';
import { FacebookIcon, GoogleIcon, InstagramIcon } from './BrandIcons';
import { useTheme } from '@minga/theme';
import { useT } from '@minga/i18n';
import { fetchProfile, updateMyProfile, uploadAvatar } from '@minga/supabase';
import { DEFAULT_COUNTRY_CODE } from '@minga/logic';
import type { DbProfile } from '@minga/types';
import { supabase } from '../supabase';
import { CountryCodeCombobox } from './CountryCodeCombobox';
import { SocialRow, type SocialBrand } from './SocialRow';

// Brand presets — same colours as the RN profile screen so all three
// platforms render the connected-accounts list identically.
const BRANDS: Record<'email' | 'google' | 'whatsapp' | 'facebook' | 'instagram', SocialBrand> = {
  email: { Icon: Mail, iconBg: '#E5E7EB', iconColor: '#374151' },
  google: { Icon: GoogleIcon, iconBg: '#FFFFFF', iconColor: '#4285F4' },
  whatsapp: { Icon: MessageCircle, iconBg: '#25D366', iconColor: '#FFFFFF' },
  facebook: { Icon: FacebookIcon, iconBg: '#1877F2', iconColor: '#FFFFFF' },
  instagram: { Icon: InstagramIcon, iconBg: '#E4405F', iconColor: '#FFFFFF' },
};

/**
 * Profile editing + connected-accounts manager. Lives in Settings (moved out
 * of the Profile page). Self-loads the signed-in user, profile, avatar, and
 * linked identities; owns the WhatsApp OTP and Instagram flows.
 */
export function AccountConnections() {
  const { theme } = useTheme();
  const { t, language } = useT();
  const [profile, setProfile] = useState<DbProfile | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [signedIn, setSignedIn] = useState<boolean>(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [identityProviders, setIdentityProviders] = useState<string[]>([]);
  const [displayName, setDisplayName] = useState<string>('');
  const [nameSaveState, setNameSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [instagramHandle, setInstagramHandle] = useState<string>('');
  const [igSaveState, setIgSaveState] = useState<'idle' | 'saving' | 'saved' | 'error' | 'invalid'>('idle');
  const [avatarState, setAvatarState] = useState<'idle' | 'uploading' | 'error'>('idle');
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [phoneCode, setPhoneCode] = useState<string>(DEFAULT_COUNTRY_CODE);
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [savedPhoneE164, setSavedPhoneE164] = useState<string | null>(null);
  const [phoneVerifiedAt, setPhoneVerifiedAt] = useState<string | null>(null);
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
      const identities = (data.user.identities ?? []) as Array<{ provider: string }>;
      const providers = identities.length
        ? identities.map((i) => i.provider)
        : ((data.user.app_metadata?.providers as string[] | undefined) ?? []);
      setIdentityProviders(Array.from(new Set(providers)));
      const p = await fetchProfile(supabase, data.user.id);
      setProfile(p);
      if (p?.display_name) setDisplayName(p.display_name);
      if (p?.phone_country_code) setPhoneCode(p.phone_country_code);
      if (p?.phone_number) setPhoneNumber(p.phone_number);
      if (p?.phone_country_code && p?.phone_number) {
        setSavedPhoneE164(`${p.phone_country_code}${p.phone_number}`);
      }
      setPhoneVerifiedAt(p?.phone_verified_at ?? null);
      if (p?.instagram_handle) setInstagramHandle(p.instagram_handle);
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
      <div style={{ color: theme.textMuted, fontSize: 14 }}>{t('profile.signInBody')}</div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Avatar + display name */}
      <div style={{ display: 'flex', gap: 18, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          {profile?.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={t('profile.avatarAlt')}
              style={{ width: 72, height: 72, borderRadius: 999, background: theme.surfaceAlt, objectFit: 'cover' }}
            />
          ) : (
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: 999,
                background: theme.primaryMuted,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: theme.primary,
                fontWeight: 800,
                fontSize: 26,
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
        <div style={{ flex: '1 1 240px', minWidth: 220 }}>
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
        </div>
      </div>

      {/* Connected accounts */}
      <div>
        <h3 style={{ color: theme.text, margin: '0 0 16px' }}>{t('profile.connectedAccounts')}</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <SocialRow
            brand={BRANDS.email}
            label={t('profile.emailLabel')}
            value={email}
            linked={!!email}
            primary={(identityProviders[0] ?? 'email') === 'email'}
            primaryAriaLabel={t('profile.primaryLogin')}
            notLinkedLabel={t('profile.notLinked')}
            verifiedLabel={t('common.verified')}
          />
          <Divider theme={theme} />
          <SocialRow
            brand={BRANDS.google}
            label={t('profile.googleLabel')}
            value={identityProviders.includes('google') ? t('profile.linked') : null}
            linked={identityProviders.includes('google')}
            primary={identityProviders[0] === 'google'}
            primaryAriaLabel={t('profile.primaryLogin')}
            notLinkedLabel={t('profile.notLinked')}
            verifiedLabel={t('common.verified')}
          />
          <Divider theme={theme} />
          <SocialRow
            brand={BRANDS.whatsapp}
            label={t('profile.whatsappLabel')}
            value={savedPhoneE164}
            linked={!!savedPhoneE164}
            verified={phoneIsVerified}
            notLinkedLabel={t('profile.notLinked')}
            verifiedLabel={t('common.verified')}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ color: theme.textMuted, fontSize: 13 }}>
                {phoneIsVerified
                  ? `Verified ${new Date(phoneVerifiedAt!).toLocaleDateString(locale)}.`
                  : t('profile.whatsappHelp')}
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <CountryCodeCombobox
                  value={phoneCode}
                  onChange={(c) => {
                    setPhoneCode(c);
                    setOtpState('idle');
                    setOtpSentTo(null);
                  }}
                  disabled={otpState !== 'idle'}
                />
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
                    flex: '1 1 180px',
                    minWidth: 160,
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
                    {t('profile.phoneSendCode')}
                  </button>
                ) : null}
                {otpState === 'sending' ? (
                  <span style={{ color: theme.textMuted, fontSize: 13 }}>{t('profile.phoneSendingCode')}</span>
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
                    {t('profile.phoneCodeSent', { phone: otpSentTo ?? '' })}
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
                      {t('profile.phoneVerify')}
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
                      {t('common.cancel')}
                    </button>
                  </div>
                </div>
              ) : null}
              {otpState === 'verifying' ? (
                <div style={{ color: theme.textMuted, fontSize: 13 }}>{t('profile.phoneVerifying')}</div>
              ) : null}
              {otpError ? <div style={{ color: theme.danger, fontSize: 13 }}>{otpError}</div> : null}
            </div>
          </SocialRow>
          <Divider theme={theme} />
          <SocialRow
            brand={BRANDS.facebook}
            label={t('profile.facebookLabel')}
            value={identityProviders.includes('facebook') ? t('profile.linked') : null}
            linked={identityProviders.includes('facebook')}
            primary={identityProviders[0] === 'facebook'}
            primaryAriaLabel={t('profile.primaryLogin')}
            notLinkedLabel={t('profile.notLinked')}
            verifiedLabel={t('common.verified')}
          />
          <Divider theme={theme} />
          <SocialRow
            brand={BRANDS.instagram}
            label={t('profile.instagramLabel')}
            value={profile?.instagram_handle ? `@${profile.instagram_handle}` : null}
            linked={!!profile?.instagram_handle}
            notLinkedLabel={t('profile.notLinked')}
            verifiedLabel={t('common.verified')}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ color: theme.textMuted, fontSize: 13 }}>{t('profile.instagramHelp')}</div>
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
          </SocialRow>
        </div>
      </div>
    </div>
  );
}

function Divider({ theme }: { theme: any }) {
  return <div style={{ height: 1, background: theme.border, opacity: 0.6 }} />;
}
