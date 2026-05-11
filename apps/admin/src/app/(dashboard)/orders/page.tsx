import Link from 'next/link';
import type { DbOrder, OrderStatus } from '@minga/types';
import { adminListOrders } from '@minga/supabase';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getT } from '@/lib/i18n/server';
import type { Key } from '@/lib/i18n/dictionary';

const STATUSES: (OrderStatus | 'all')[] = [
  'pending',
  'approved',
  'declined',
  'voided',
  'error',
  'refunded',
  'all',
];

const STATUS_KEY: Record<OrderStatus | 'all', Key> = {
  pending: 'orders.status.pending',
  approved: 'orders.status.approved',
  declined: 'orders.status.declined',
  voided: 'orders.status.voided',
  error: 'orders.status.error',
  refunded: 'orders.status.refunded',
  all: 'orders.status.all',
};

const PILL: Record<OrderStatus, string> = {
  pending: 'bg-amber-100 text-amber-800',
  approved: 'bg-success/10 text-success',
  declined: 'bg-danger/10 text-danger',
  voided: 'bg-ink-300/20 text-ink-500',
  error: 'bg-danger/10 text-danger',
  refunded: 'bg-ink-300/20 text-ink-500',
};

function fmtPrice(cents: number, currency: string) {
  try {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency }).format(cents / 100);
  } catch {
    return `${currency} ${(cents / 100).toFixed(2)}`;
  }
}

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const params = await searchParams;
  const filter = (params.status as OrderStatus | 'all') || 'all';

  const supabase = await createSupabaseServerClient();
  const orders = await adminListOrders(supabase, { status: filter });
  const { t, locale } = await getT();
  const dateLocale = locale === 'es' ? 'es-CO' : 'en-US';

  return (
    <div>
      <header>
        <h1 className="text-2xl font-bold">{t('orders.title')}</h1>
        <p className="text-ink-500 mt-1">{t('orders.subtitle')}</p>
      </header>

      <nav className="mt-6 flex flex-wrap gap-1 text-sm">
        {STATUSES.map((s) => {
          const active = filter === s;
          return (
            <Link
              key={s}
              href={`/orders?status=${s}`}
              className={
                active
                  ? 'px-3 py-1.5 rounded-full bg-ink-900 text-white font-semibold'
                  : 'px-3 py-1.5 rounded-full bg-surface border border-surface-border text-ink-700 hover:bg-surface-alt'
              }
            >
              {t(STATUS_KEY[s])}
            </Link>
          );
        })}
      </nav>

      <div className="mt-6 card p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface-alt text-left text-xs uppercase tracking-wide text-ink-500">
            <tr>
              <th className="px-4 py-3">{t('orders.col.reference')}</th>
              <th className="px-4 py-3">{t('orders.col.amount')}</th>
              <th className="px-4 py-3">{t('orders.col.status')}</th>
              <th className="px-4 py-3">{t('orders.col.buyer')}</th>
              <th className="px-4 py-3">{t('orders.col.created')}</th>
              <th className="px-4 py-3 text-right">{t('orders.col.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o: DbOrder) => (
              <tr key={o.id} className="border-t border-surface-border">
                <td className="px-4 py-3 font-mono text-xs">{o.wompi_reference.slice(0, 8)}…</td>
                <td className="px-4 py-3">{fmtPrice(o.amount_cents, o.currency)}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${PILL[o.status]}`}>
                    {t(STATUS_KEY[o.status])}
                  </span>
                </td>
                <td className="px-4 py-3 text-ink-500">
                  {o.buyer_profile_id ? t('orders.buyer.account') : t('orders.buyer.guest')}
                </td>
                <td className="px-4 py-3 text-ink-500 whitespace-nowrap">
                  {new Date(o.created_at).toLocaleString(dateLocale)}
                </td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/orders/${o.id}`} className="btn-secondary text-xs">
                    {t('orders.action.view')}
                  </Link>
                </td>
              </tr>
            ))}
            {orders.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-ink-500">
                  {t('orders.empty')}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
