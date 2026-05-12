// Shared post-payment screen. Polls `wompi-order-status` until the order
// reaches a terminal state, then mirrors apps/web's OrderSuccessPage: shows
// the booking summary and prompts guests to create an account.
//
// React Native primitives so it renders in apps/mobile (Expo) and apps/mobile-web
// (react-native-web). The polling logic is identical to the web page.

import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import { useTheme, spacing, radii, fontSizes, fontWeights } from '@minga/theme';
import { useT } from '@minga/i18n';
import { formatPriceCents } from '@minga/logic';
import { getSupabase } from '@minga/supabase';
import type { OrderStatus } from '@minga/types';
import { Button } from '../primitives/Button';

interface OrderResponse {
  id: string;
  status: OrderStatus;
  amount_cents: number;
  currency: string;
  paid_at: string | null;
  wompi_status_message: string | null;
  expedition: {
    id: string;
    title: string;
    location_name: string;
    country: string;
  } | null;
}

export interface OrderSuccessScreenProps {
  orderId: string;
  functionsBaseUrl: string;
  supabaseAnonKey: string;
  onBack?: () => void;
  // When the post-payment "Create account" CTA is tapped. Hosts route this
  // to AuthScreen. If omitted, the CTA is hidden (e.g. host has no auth UI).
  onSignUp?: () => void;
  // Optional: jump back to the expedition detail. If omitted, the link hides.
  onOpenExpedition?: (expeditionId: string) => void;
}

export function OrderSuccessScreen({
  orderId,
  functionsBaseUrl,
  supabaseAnonKey,
  onBack,
  onSignUp,
  onOpenExpedition,
}: OrderSuccessScreenProps) {
  const { theme } = useTheme();
  const { t } = useT();
  const [order, setOrder] = useState<OrderResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Whether the viewer is signed in. Drives whether we show the
  // "Create account" CTA after a successful payment.
  const [isGuest, setIsGuest] = useState<boolean>(true);
  const stopped = useRef(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const { data } = await getSupabase().auth.getSession();
      if (cancelled) return;
      // Treat anonymous Supabase sessions as guests for the account prompt.
      const isAnon = data.session?.user?.is_anonymous === true;
      setIsGuest(!data.session?.user || isAnon);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Poll for status until terminal. Wompi delivers the webhook within seconds.
  useEffect(() => {
    if (!orderId) return;
    stopped.current = false;
    let cancelled = false;
    let attempts = 0;

    const poll = async () => {
      while (!cancelled && !stopped.current && attempts < 60) {
        attempts++;
        try {
          const res = await fetch(`${functionsBaseUrl}/wompi-order-status`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', apikey: supabaseAnonKey },
            body: JSON.stringify({ orderId }),
          });
          const json = (await res.json()) as OrderResponse | { error: string };
          if (!res.ok || 'error' in json) {
            throw new Error('error' in json ? json.error : t('order.errorLoadFailed'));
          }
          if (cancelled) return;
          setOrder(json);
          if (json.status !== 'pending') return; // terminal
        } catch (e) {
          if (cancelled) return;
          setError((e as Error).message);
          return;
        }
        await new Promise((r) => setTimeout(r, 2000));
      }
    };

    void poll();
    return () => {
      cancelled = true;
      stopped.current = true;
    };
  }, [orderId, functionsBaseUrl, supabaseAnonKey]);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.background }}
      contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg }}
    >
      <Header status={order?.status} theme={theme} t={t} />

      {!order && !error ? (
        <View style={{ paddingVertical: spacing.lg }}>
          <ActivityIndicator />
        </View>
      ) : null}

      {order ? (
        <View
          style={{
            padding: spacing.lg,
            backgroundColor: theme.surface,
            borderColor: theme.border,
            borderWidth: 1,
            borderRadius: radii.lg,
            gap: spacing.sm,
          }}
        >
          {order.expedition ? (
            <View>
              <Text
                style={{
                  color: theme.textMuted,
                  fontSize: fontSizes.xs,
                  fontWeight: fontWeights.bold,
                  letterSpacing: 1,
                  textTransform: 'uppercase',
                }}
              >
                {t('order.expeditionLabel')}
              </Text>
              <Text
                style={{
                  color: theme.text,
                  fontSize: fontSizes.xl,
                  fontWeight: fontWeights.heavy,
                  marginTop: 4,
                }}
              >
                {order.expedition.title}
              </Text>
              <Text style={{ color: theme.textMuted, marginTop: 4 }}>
                {order.expedition.location_name}, {order.expedition.country}
              </Text>
            </View>
          ) : null}
          <Text style={{ color: theme.text, fontWeight: fontWeights.semibold }}>
            {formatPriceCents(order.amount_cents, { currency: order.currency, freeLabel: t('common.free') })}
          </Text>
          {order.wompi_status_message ? (
            <Text style={{ color: theme.textMuted, fontSize: fontSizes.sm }}>
              {order.wompi_status_message}
            </Text>
          ) : null}
        </View>
      ) : null}

      {order?.status === 'approved' && isGuest && onSignUp ? (
        <View
          style={{
            padding: spacing.lg,
            backgroundColor: theme.primaryMuted,
            borderColor: theme.primary,
            borderWidth: 1,
            borderRadius: radii.lg,
            gap: spacing.sm,
          }}
        >
          <Text style={{ color: theme.text, fontWeight: fontWeights.bold }}>
            {t('order.saveBookingTitle')}
          </Text>
          <Text style={{ color: theme.textMuted, fontSize: fontSizes.sm, lineHeight: 20 }}>
            {t('order.saveBookingBody')}
          </Text>
          <Button label={t('order.createAccount')} onPress={onSignUp} />
        </View>
      ) : null}

      {error ? <Text style={{ color: theme.danger }}>{error}</Text> : null}

      <View style={{ flexDirection: 'row', gap: spacing.md, flexWrap: 'wrap' }}>
        {order?.expedition && onOpenExpedition ? (
          <Button
            label={t('order.backToExpedition')}
            variant="secondary"
            onPress={() => onOpenExpedition(order.expedition!.id)}
          />
        ) : null}
        {onBack ? <Button label={t('order.done')} variant="ghost" onPress={onBack} /> : null}
      </View>
    </ScrollView>
  );
}

function Header({
  status,
  theme,
  t,
}: {
  status?: OrderStatus;
  theme: ReturnType<typeof useTheme>['theme'];
  t: ReturnType<typeof useT>['t'];
}) {
  const { title, sub, color } = (() => {
    switch (status) {
      case 'approved':
        return {
          title: t('order.status.approvedTitle'),
          sub: t('order.status.approvedSub'),
          color: theme.primary,
        };
      case 'declined':
        return {
          title: t('order.status.declinedTitle'),
          sub: t('order.status.declinedSub'),
          color: theme.danger,
        };
      case 'voided':
        return {
          title: t('order.status.voidedTitle'),
          sub: t('order.status.voidedSub'),
          color: theme.textMuted,
        };
      case 'error':
        return {
          title: t('order.status.errorTitle'),
          sub: t('order.status.errorSub'),
          color: theme.danger,
        };
      case 'refunded':
        return {
          title: t('order.status.refundedTitle'),
          sub: t('order.status.refundedSub'),
          color: theme.textMuted,
        };
      case 'pending':
      default:
        return {
          title: t('order.status.pendingTitle'),
          sub: t('order.status.pendingSub'),
          color: theme.textMuted,
        };
    }
  })();
  return (
    <View style={{ gap: spacing.xs }}>
      <Text
        style={{
          color: theme.text,
          fontSize: fontSizes['2xl'],
          fontWeight: fontWeights.heavy,
        }}
      >
        {title}
      </Text>
      <Text style={{ color, fontSize: fontSizes.md }}>{sub}</Text>
    </View>
  );
}
