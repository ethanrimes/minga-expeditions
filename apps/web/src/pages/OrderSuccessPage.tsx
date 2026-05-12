import React, { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTheme } from '@minga/theme';
import { useT } from '@minga/i18n';
import { formatPriceCents } from '@minga/logic';
import type { OrderStatus } from '@minga/types';

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

const env = import.meta.env as unknown as Record<string, string>;
const FUNCTIONS_BASE = `${env.VITE_SUPABASE_URL}/functions/v1`;

export function OrderSuccessPage() {
  const { id } = useParams<{ id: string }>();
  const { theme } = useTheme();
  const { t } = useT();
  const [order, setOrder] = useState<OrderResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const stopped = useRef(false);

  // Poll for status until terminal. Wompi delivers the webhook within seconds.
  useEffect(() => {
    if (!id) return;
    stopped.current = false;
    let cancelled = false;
    let attempts = 0;

    const poll = async () => {
      while (!cancelled && !stopped.current && attempts < 60) {
        attempts++;
        try {
          const res = await fetch(`${FUNCTIONS_BASE}/wompi-order-status`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', apikey: env.VITE_SUPABASE_ANON_KEY },
            body: JSON.stringify({ orderId: id }),
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
  }, [id]);

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: '64px 24px' }}>
      <Header status={order?.status} theme={theme} t={t} />

      {order ? (
        <div
          style={{
            marginTop: 24,
            padding: 24,
            background: theme.surface,
            border: `1px solid ${theme.border}`,
            borderRadius: 16,
          }}
        >
          {order.expedition ? (
            <div>
              <div style={{ color: theme.textMuted, fontSize: 12, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase' }}>
                {t('order.expeditionLabel')}
              </div>
              <div style={{ color: theme.text, fontSize: 22, fontWeight: 800, marginTop: 4 }}>{order.expedition.title}</div>
              <div style={{ color: theme.textMuted, marginTop: 4 }}>
                {order.expedition.location_name}, {order.expedition.country}
              </div>
            </div>
          ) : null}
          <div style={{ marginTop: 16, color: theme.text }}>
            <strong>{formatPriceCents(order.amount_cents, { currency: order.currency, freeLabel: t('common.free') })}</strong>
          </div>
          {order.wompi_status_message ? (
            <div style={{ marginTop: 16, color: theme.textMuted, fontSize: 14 }}>{order.wompi_status_message}</div>
          ) : null}
        </div>
      ) : null}

      {order?.status === 'approved' ? (
        <div
          style={{
            marginTop: 24,
            padding: 20,
            background: theme.primaryMuted,
            border: `1px solid ${theme.primary}`,
            borderRadius: 16,
          }}
        >
          <div style={{ color: theme.text, fontWeight: 700 }}>{t('order.saveBookingTitle')}</div>
          <div style={{ color: theme.textMuted, fontSize: 14, marginTop: 6, lineHeight: 1.5 }}>
            {t('order.saveBookingBody')}
          </div>
          <Link
            to="/auth"
            style={{
              display: 'inline-block',
              marginTop: 14,
              background: theme.primary,
              color: theme.onPrimary,
              borderRadius: 999,
              padding: '12px 22px',
              fontWeight: 800,
            }}
          >
            {t('order.createAccount')}
          </Link>
        </div>
      ) : null}

      {error ? (
        <div style={{ marginTop: 24, color: theme.danger }}>{error}</div>
      ) : null}

      {order?.expedition ? (
        <div style={{ marginTop: 24 }}>
          <Link to={`/expeditions/${order.expedition.id}`} style={{ color: theme.primary, fontWeight: 700 }}>
            {t('order.backToExpedition')}
          </Link>
        </div>
      ) : null}
    </div>
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
        return { title: t('order.status.approvedTitle'), sub: t('order.status.approvedSub'), color: theme.primary };
      case 'declined':
        return { title: t('order.status.declinedTitle'), sub: t('order.status.declinedSub'), color: theme.danger };
      case 'voided':
        return { title: t('order.status.voidedTitle'), sub: t('order.status.voidedSub'), color: theme.textMuted };
      case 'error':
        return { title: t('order.status.errorTitle'), sub: t('order.status.errorSub'), color: theme.danger };
      case 'refunded':
        return { title: t('order.status.refundedTitle'), sub: t('order.status.refundedSub'), color: theme.textMuted };
      case 'pending':
      default:
        return { title: t('order.status.pendingTitle'), sub: t('order.status.pendingSub'), color: theme.textMuted };
    }
  })();
  return (
    <div>
      <h1 style={{ color: theme.text, fontSize: 32, fontWeight: 800 }}>{title}</h1>
      <p style={{ color, marginTop: 6 }}>{sub}</p>
    </div>
  );
}
