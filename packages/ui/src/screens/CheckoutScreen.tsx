// Shared in-app booking form. Mirrors apps/web's CheckoutDrawer: prefill from
// the signed-in session + profile, collect what's missing, call
// `wompi-create-order`, then hand off to Wompi's hosted checkout via an
// injected adapter (Linking.openURL on RN, window.location.assign on web).
//
// React Native primitives only so the same screen renders natively in
// apps/mobile (Expo) and via react-native-web in apps/mobile-web.

import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useTheme, spacing, radii, fontSizes, fontWeights } from '@minga/theme';
import { useT } from '@minga/i18n';
import { formatPriceCents, formatSalidaDate, DEFAULT_COUNTRY_CODE } from '@minga/logic';
import { getSupabase } from '@minga/supabase';
import { Button } from '../primitives/Button';
import { Input } from '../primitives/Input';
import { CountryCodeCombobox } from '../primitives/CountryCodeCombobox';

type Mode = 'collect-info' | 'opening-widget' | 'redirecting';

const WOMPI_HOSTED_CHECKOUT_URL = 'https://checkout.wompi.co/p/';

export interface CheckoutScreenProps {
  expeditionId: string;
  expeditionTitle: string;
  priceCents: number;
  currency: string;
  salidaId?: string | null;
  salidaStartsAt?: string | null;
  salidaTimezone?: string | null;
  // `${SUPABASE_URL}/functions/v1` — supplied by the host app so this shared
  // screen doesn't depend on Vite/Expo env shapes.
  functionsBaseUrl: string;
  // When true, render the WhatsApp phone field and require it. Mirrors the
  // VITE_WHATSAPP_ENABLED / EXPO_PUBLIC_WHATSAPP_ENABLED flag on the host.
  whatsappEnabled?: boolean;
  // Origin Wompi will redirect to after the user completes/cancels payment.
  // The server appends `/orders/<id>/success` to this when minting the URL.
  returnOrigin: string;
  // Host-supplied URL opener. RN passes Linking.openURL; the web passes a
  // function that does window.location.assign / window.open.
  openCheckoutUrl: (url: string) => void | Promise<void>;
  onClose: () => void;
  // Called once the pending order is created. The host typically navigates to
  // the OrderSuccessScreen so it's polling status when the user returns from
  // the Wompi page.
  onOrderCreated?: (orderId: string) => void;
}

export function CheckoutScreen({
  expeditionId,
  expeditionTitle,
  priceCents,
  currency,
  salidaId,
  salidaStartsAt,
  salidaTimezone,
  functionsBaseUrl,
  whatsappEnabled = false,
  returnOrigin,
  openCheckoutUrl,
  onClose,
  onOrderCreated,
}: CheckoutScreenProps) {
  const { theme } = useTheme();
  const { t } = useT();

  const [mode, setMode] = useState<Mode>('collect-info');
  const [email, setEmail] = useState('');
  const [signedInEmail, setSignedInEmail] = useState<string | null>(null);
  const [signedInUserId, setSignedInUserId] = useState<string | null>(null);
  const [phoneCode, setPhoneCode] = useState<string>(DEFAULT_COUNTRY_CODE);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Prefill email/name/phone from the signed-in session + profile row. Same
  // logic as the web drawer: skip asking for anything the server already
  // knows. Guests see empty fields and we create a guest_contacts row at
  // submit time.
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const supabase = getSupabase();
      const { data } = await supabase.auth.getSession();
      if (cancelled) return;
      const user = data.session?.user;
      const userEmail = user?.email?.trim() || null;
      const userMeta = user?.user_metadata as Record<string, unknown> | undefined;
      const userName =
        (typeof userMeta?.full_name === 'string' ? userMeta.full_name : null) ??
        (typeof userMeta?.name === 'string' ? userMeta.name : null);
      if (userEmail) {
        setSignedInEmail(userEmail);
        setEmail(userEmail);
      }
      if (userName) setName((current) => current || userName);
      if (!user?.id) return;
      setSignedInUserId(user.id);
      const { data: profile } = await supabase
        .from('profiles')
        .select('phone_country_code, phone_number')
        .eq('id', user.id)
        .maybeSingle();
      if (cancelled || !profile) return;
      const p = profile as { phone_country_code: string | null; phone_number: string | null };
      if (p.phone_country_code) setPhoneCode(p.phone_country_code);
      if (p.phone_number) setPhoneNumber(p.phone_number);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const submit = async () => {
    setError(null);
    if (!email.trim()) {
      setError(t('checkout.errorEmailRequired'));
      return;
    }
    const trimmedNumber = phoneNumber.replace(/\D/g, '');
    // Phone is requested but not required — see CheckoutDrawer for the same
    // policy on web.
    const phoneE164 = trimmedNumber ? `${phoneCode}${trimmedNumber}` : '';
    setMode('opening-widget');
    try {
      const supabase = getSupabase();
      const session = await supabase.auth.getSession();
      const accessToken = session.data.session?.access_token;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (accessToken) headers.Authorization = `Bearer ${accessToken}`;

      if (signedInUserId && trimmedNumber) {
        void supabase
          .from('profiles')
          .update({ phone_country_code: phoneCode, phone_number: trimmedNumber })
          .eq('id', signedInUserId);
      }

      const res = await fetch(`${functionsBaseUrl}/wompi-create-order`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          expedition_id: expeditionId,
          salida_id: salidaId ?? undefined,
          return_origin: returnOrigin,
          guest: {
            email: email.trim() || undefined,
            phone: phoneE164 || undefined,
            display_name: name.trim() || undefined,
          },
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? t('checkout.errorGeneric'));

      onOrderCreated?.(json.orderId);

      // Build Wompi's hosted Web Checkout URL. The hosted page works
      // identically to the JS widget but is reachable from React Native
      // (no DOM required) and from any browser via redirect.
      // Reference: https://docs.wompi.co/docs/colombia/widget-checkout-web/
      const params = new URLSearchParams();
      params.set('public-key', json.publicKey);
      params.set('currency', json.currency);
      params.set('amount-in-cents', String(json.amountInCents));
      params.set('reference', json.reference);
      params.set('signature:integrity', json.signature);
      params.set('redirect-url', json.redirectUrl);
      if (email.trim()) params.set('customer-data:email', email.trim());
      if (name.trim()) params.set('customer-data:full-name', name.trim());
      if (trimmedNumber) {
        params.set('customer-data:phone-number-prefix', phoneCode);
        params.set('customer-data:phone-number', trimmedNumber);
      }
      const checkoutUrl = `${WOMPI_HOSTED_CHECKOUT_URL}?${params.toString()}`;

      setMode('redirecting');
      await openCheckoutUrl(checkoutUrl);
    } catch (err) {
      const msg =
        err && typeof err === 'object' && 'message' in err && (err as { message?: unknown }).message
          ? String((err as { message: unknown }).message)
          : String(err);
      setError(msg);
      setMode('collect-info');
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          padding: spacing.lg,
          borderBottomWidth: 1,
          borderBottomColor: theme.border,
        }}
      >
        <View style={{ flex: 1, paddingRight: spacing.md }}>
          <Text
            style={{
              color: theme.textMuted,
              fontSize: fontSizes.xs,
              fontWeight: fontWeights.bold,
              letterSpacing: 1,
              textTransform: 'uppercase',
            }}
          >
            {t('checkout.eyebrow')}
          </Text>
          <Text
            style={{
              color: theme.text,
              fontSize: fontSizes.lg,
              fontWeight: fontWeights.bold,
              marginTop: 4,
            }}
            numberOfLines={2}
          >
            {expeditionTitle}
          </Text>
          {salidaStartsAt ? (
            <Text style={{ color: theme.textMuted, fontSize: fontSizes.sm, marginTop: 4 }}>
              {formatSalidaDate(salidaStartsAt, {
                tz: salidaTimezone ?? undefined,
                withTime: true,
              })}
            </Text>
          ) : null}
        </View>
        <Pressable
          onPress={onClose}
          accessibilityLabel={t('checkout.close')}
          hitSlop={12}
          style={{ paddingHorizontal: spacing.sm, paddingVertical: spacing.xs }}
        >
          <Text style={{ color: theme.textMuted, fontSize: 28, lineHeight: 28 }}>×</Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg }}
        keyboardShouldPersistTaps="handled"
      >
        <View
          style={{
            padding: spacing.md,
            backgroundColor: theme.surfaceAlt,
            borderRadius: radii.md,
          }}
        >
          <Text
            style={{
              color: theme.text,
              fontSize: fontSizes['2xl'],
              fontWeight: fontWeights.bold,
            }}
          >
            {formatPriceCents(priceCents, { currency, freeLabel: t('common.free') })}
          </Text>
        </View>

        {signedInEmail ? (
          <View
            style={{
              backgroundColor: theme.surfaceAlt,
              borderColor: theme.border,
              borderWidth: 1,
              borderRadius: radii.md,
              padding: spacing.md,
            }}
          >
            <Text
              style={{
                color: theme.textMuted,
                fontSize: fontSizes.xs,
                fontWeight: fontWeights.bold,
                letterSpacing: 0.3,
                textTransform: 'uppercase',
              }}
            >
              {t('checkout.signedInAs')}
            </Text>
            <Text style={{ color: theme.text, marginTop: 2, fontWeight: fontWeights.semibold }}>
              {signedInEmail}
            </Text>
          </View>
        ) : (
          <View style={{ gap: spacing.md }}>
            <Input
              label={t('checkout.fieldName')}
              value={name}
              onChangeText={setName}
              placeholder={t('checkout.fieldNamePlaceholder')}
              autoCapitalize="words"
            />
            <Input
              label={t('checkout.fieldEmail')}
              value={email}
              onChangeText={setEmail}
              placeholder={t('checkout.fieldEmailPlaceholder')}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
            />
          </View>
        )}

        {whatsappEnabled ? (
          <View style={{ gap: spacing.xs }}>
            <Text
              style={{ color: theme.text, fontSize: fontSizes.sm, fontWeight: fontWeights.semibold }}
            >
              {t('checkout.fieldPhone')}
            </Text>
            <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' }}>
              <CountryCodeCombobox value={phoneCode} onChange={(c) => setPhoneCode(c)} />
              <View style={{ flex: 1 }}>
                <Input
                  value={phoneNumber}
                  onChangeText={(v) => setPhoneNumber(v.replace(/[^\d]/g, ''))}
                  placeholder={t('checkout.fieldPhonePlaceholder')}
                  keyboardType="phone-pad"
                />
              </View>
            </View>
            <Text style={{ color: theme.textMuted, fontSize: fontSizes.xs, lineHeight: 18 }}>
              {t('checkout.fieldPhoneHelp')}
            </Text>
          </View>
        ) : null}

        <Text style={{ color: theme.textMuted, fontSize: fontSizes.xs, lineHeight: 18 }}>
          {whatsappEnabled
            ? t('checkout.confirmationEmailWhatsapp')
            : t('checkout.confirmationEmail')}
        </Text>

        {error ? (
          <Text style={{ color: theme.danger, fontSize: fontSizes.sm }}>{error}</Text>
        ) : null}

        <Button
          label={
            mode === 'collect-info'
              ? t('checkout.payButton')
              : mode === 'opening-widget'
                ? t('checkout.opening')
                : t('checkout.redirecting')
          }
          onPress={submit}
          disabled={mode !== 'collect-info'}
          fullWidth
          size="lg"
        />
      </ScrollView>
    </View>
  );
}

