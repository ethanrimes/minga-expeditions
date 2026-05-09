import Link from 'next/link';
import type { DbOrder, OrderStatus } from '@minga/types';
import { adminListOrders } from '@minga/supabase';
import { createSupabaseServerClient } from '@/lib/supabase/server';

const STATUSES: (OrderStatus | 'all')[] = [
  'pending',
  'approved',
  'declined',
  'voided',
  'error',
  'refunded',
  'all',
];

const LABEL: Record<OrderStatus | 'all', string> = {
  pending: 'Pending',
  approved: 'Approved',
  declined: 'Declined',
  voided: 'Voided',
  error: 'Error',
  refunded: 'Refunded',
  all: 'All',
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

  return (
    <div>
      <header>
        <h1 className="text-2xl font-bold">Orders</h1>
        <p className="text-ink-500 mt-1">All Wompi transactions, including pending and failed payments.</p>
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
              {LABEL[s]}
            </Link>
          );
        })}
      </nav>

      <div className="mt-6 card p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface-alt text-left text-xs uppercase tracking-wide text-ink-500">
            <tr>
              <th className="px-4 py-3">Reference</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Buyer</th>
              <th className="px-4 py-3">Created</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o: DbOrder) => (
              <tr key={o.id} className="border-t border-surface-border">
                <td className="px-4 py-3 font-mono text-xs">{o.wompi_reference.slice(0, 8)}…</td>
                <td className="px-4 py-3">{fmtPrice(o.amount_cents, o.currency)}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${PILL[o.status]}`}>
                    {LABEL[o.status]}
                  </span>
                </td>
                <td className="px-4 py-3 text-ink-500">
                  {o.buyer_profile_id ? 'Account' : 'Guest'}
                </td>
                <td className="px-4 py-3 text-ink-500 whitespace-nowrap">
                  {new Date(o.created_at).toLocaleString()}
                </td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/orders/${o.id}`} className="btn-secondary text-xs">
                    View
                  </Link>
                </td>
              </tr>
            ))}
            {orders.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-ink-500">
                  No orders match this filter.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
