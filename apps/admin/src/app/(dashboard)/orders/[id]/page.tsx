import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { OrderStatus } from '@minga/types';
import { fetchOrderById, fetchSalidaById } from '@minga/supabase';
import { formatSalidaRange } from '@minga/logic';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getT } from '@/lib/i18n/server';
import type { Key } from '@/lib/i18n/dictionary';

const STATUS_KEY: Record<OrderStatus, Key> = {
  pending: 'orders.status.pending',
  approved: 'orders.status.approved',
  declined: 'orders.status.declined',
  voided: 'orders.status.voided',
  error: 'orders.status.error',
  refunded: 'orders.status.refunded',
};

function fmtPrice(cents: number, currency: string) {
  try {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency }).format(cents / 100);
  } catch {
    return `${currency} ${(cents / 100).toFixed(2)}`;
  }
}

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const order = await fetchOrderById(supabase, id);
  if (!order) notFound();

  const [{ data: expedition }, { data: profile }, { data: guest }, salida] = await Promise.all([
    supabase.from('expeditions').select('id, title, location_name, country').eq('id', order.expedition_id).maybeSingle(),
    order.buyer_profile_id
      ? supabase.from('profiles').select('id, display_name, username').eq('id', order.buyer_profile_id).maybeSingle()
      : Promise.resolve({ data: null }),
    order.buyer_guest_contact_id
      ? supabase.from('guest_contacts').select('*').eq('id', order.buyer_guest_contact_id).maybeSingle()
      : Promise.resolve({ data: null }),
    order.salida_id ? fetchSalidaById(supabase, order.salida_id) : Promise.resolve(null),
  ]);

  const { t, locale } = await getT();
  const dateLocale = locale === 'es' ? 'es-CO' : 'en-US';

  return (
    <div>
      <Link href="/orders" className="text-sm text-ink-500 hover:text-ink-700">
        {t('orderDetail.back')}
      </Link>
      <h1 className="text-2xl font-bold mt-3">{t('orderDetail.title')}</h1>
      <p className="text-ink-500 mt-1 font-mono text-xs break-all">{order.wompi_reference}</p>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="card lg:col-span-2 space-y-3">
          <h2 className="font-semibold">{t('orderDetail.payment')}</h2>
          <Row label={t('orderDetail.row.status')} value={t(STATUS_KEY[order.status])} />
          <Row label={t('orderDetail.row.amount')} value={fmtPrice(order.amount_cents, order.currency)} />
          <Row label={t('orderDetail.row.txId')} value={order.wompi_transaction_id ?? '—'} />
          <Row label={t('orderDetail.row.method')} value={order.wompi_payment_method_type ?? '—'} />
          <Row label={t('orderDetail.row.statusMessage')} value={order.wompi_status_message ?? '—'} />
          <Row
            label={t('orderDetail.row.paidAt')}
            value={order.paid_at ? new Date(order.paid_at).toLocaleString(dateLocale) : '—'}
          />
          <Row label={t('orderDetail.row.created')} value={new Date(order.created_at).toLocaleString(dateLocale)} />
        </section>

        <aside className="space-y-6">
          <section className="card">
            <h2 className="font-semibold mb-3">{t('orderDetail.expedition')}</h2>
            {expedition ? (
              <>
                <div className="font-medium">{expedition.title}</div>
                <div className="text-sm text-ink-500">
                  {expedition.location_name}, {expedition.country}
                </div>
              </>
            ) : (
              <div className="text-ink-500 text-sm">{t('orderDetail.expeditionDeleted')}</div>
            )}
          </section>

          <section className="card">
            <h2 className="font-semibold mb-3">{t('orderDetail.salida')}</h2>
            {salida ? (
              <div className="text-sm">
                {formatSalidaRange(salida.starts_at, salida.ends_at, { locale: dateLocale, tz: salida.timezone })}
              </div>
            ) : (
              <div className="text-ink-500 text-sm">{t('orderDetail.salidaNone')}</div>
            )}
          </section>

          <section className="card">
            <h2 className="font-semibold mb-3">{t('orderDetail.buyer')}</h2>
            {profile ? (
              <>
                <div className="font-medium">{profile.display_name}</div>
                <div className="text-sm text-ink-500">@{profile.username}</div>
                <div className="text-xs text-ink-500 mt-1">{t('orderDetail.guestSignedIn')}</div>
              </>
            ) : guest ? (
              <>
                <div className="font-medium">{guest.display_name ?? t('orderDetail.guestNoName')}</div>
                <div className="text-sm text-ink-500">{guest.email ?? '—'}</div>
                <div className="text-sm text-ink-500">{guest.phone ?? '—'}</div>
                <div className="text-xs text-ink-500 mt-1">
                  {guest.claimed_by_profile_id ? t('orderDetail.guestClaimed') : t('orderDetail.guestUnclaimed')}
                </div>
              </>
            ) : (
              <div className="text-ink-500 text-sm">{t('orderDetail.buyerNone')}</div>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 text-sm">
      <span className="text-ink-500">{label}</span>
      <span className="text-ink-900 text-right break-all">{value}</span>
    </div>
  );
}
