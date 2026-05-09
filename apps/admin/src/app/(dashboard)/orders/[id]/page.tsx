import Link from 'next/link';
import { notFound } from 'next/navigation';
import { fetchOrderById } from '@minga/supabase';
import { createSupabaseServerClient } from '@/lib/supabase/server';

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

  const [{ data: expedition }, { data: profile }, { data: guest }] = await Promise.all([
    supabase.from('expeditions').select('id, title, location_name, country').eq('id', order.expedition_id).maybeSingle(),
    order.buyer_profile_id
      ? supabase.from('profiles').select('id, display_name, username').eq('id', order.buyer_profile_id).maybeSingle()
      : Promise.resolve({ data: null }),
    order.buyer_guest_contact_id
      ? supabase.from('guest_contacts').select('*').eq('id', order.buyer_guest_contact_id).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  return (
    <div>
      <Link href="/orders" className="text-sm text-ink-500 hover:text-ink-700">
        ← Back to orders
      </Link>
      <h1 className="text-2xl font-bold mt-3">Order detail</h1>
      <p className="text-ink-500 mt-1 font-mono text-xs break-all">{order.wompi_reference}</p>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="card lg:col-span-2 space-y-3">
          <h2 className="font-semibold">Payment</h2>
          <Row label="Status" value={order.status} />
          <Row label="Amount" value={fmtPrice(order.amount_cents, order.currency)} />
          <Row label="Wompi transaction id" value={order.wompi_transaction_id ?? '—'} />
          <Row label="Payment method" value={order.wompi_payment_method_type ?? '—'} />
          <Row label="Status message" value={order.wompi_status_message ?? '—'} />
          <Row label="Paid at" value={order.paid_at ? new Date(order.paid_at).toLocaleString() : '—'} />
          <Row label="Created" value={new Date(order.created_at).toLocaleString()} />
        </section>

        <aside className="space-y-6">
          <section className="card">
            <h2 className="font-semibold mb-3">Expedition</h2>
            {expedition ? (
              <>
                <div className="font-medium">{expedition.title}</div>
                <div className="text-sm text-ink-500">
                  {expedition.location_name}, {expedition.country}
                </div>
              </>
            ) : (
              <div className="text-ink-500 text-sm">Expedition deleted.</div>
            )}
          </section>

          <section className="card">
            <h2 className="font-semibold mb-3">Buyer</h2>
            {profile ? (
              <>
                <div className="font-medium">{profile.display_name}</div>
                <div className="text-sm text-ink-500">@{profile.username}</div>
                <div className="text-xs text-ink-500 mt-1">Signed-in account</div>
              </>
            ) : guest ? (
              <>
                <div className="font-medium">{guest.display_name ?? '(no name)'}</div>
                <div className="text-sm text-ink-500">{guest.email ?? '—'}</div>
                <div className="text-sm text-ink-500">{guest.phone ?? '—'}</div>
                <div className="text-xs text-ink-500 mt-1">
                  {guest.claimed_by_profile_id ? 'Claimed' : 'Unclaimed guest'}
                </div>
              </>
            ) : (
              <div className="text-ink-500 text-sm">No buyer linked.</div>
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
