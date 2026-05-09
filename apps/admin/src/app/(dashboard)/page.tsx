import Link from 'next/link';
import { orderCounts, vendorProposalCounts } from '@minga/supabase';
import { createSupabaseServerClient } from '@/lib/supabase/server';

async function counts() {
  const supabase = await createSupabaseServerClient();
  const [expeditions, categories, profiles, proposals, orders] = await Promise.all([
    supabase.from('expeditions').select('*', { count: 'exact', head: true }),
    supabase.from('categories').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    vendorProposalCounts(supabase),
    orderCounts(supabase),
  ]);
  return {
    expeditions: expeditions.count ?? 0,
    categories: categories.count ?? 0,
    profiles: profiles.count ?? 0,
    proposals,
    orders,
  };
}

export default async function DashboardPage() {
  const c = await counts();
  const newProposals = c.proposals.new;
  return (
    <div>
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <p className="text-ink-500 mt-1">High-level snapshot of the platform.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
        <Stat label="Expeditions" value={c.expeditions} href="/expeditions" />
        <Stat label="Categories" value={c.categories} href="/categories" />
        <Stat label="Profiles" value={c.profiles} />
        <Stat
          label="New proposals"
          value={newProposals}
          href="/vendor-proposals"
          highlight={newProposals > 0}
        />
        <Stat label="Approved orders" value={c.orders.approved} href="/orders?status=approved" />
        <Stat
          label="Pending orders"
          value={c.orders.pending}
          href="/orders?status=pending"
          highlight={c.orders.pending > 0}
        />
        <Stat label="Declined orders" value={c.orders.declined} href="/orders?status=declined" />
      </div>

      {newProposals > 0 ? (
        <div className="mt-6 card border-primary/40 bg-primary/5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="font-semibold">
                {newProposals} unreviewed vendor proposal{newProposals === 1 ? '' : 's'}
              </div>
              <div className="text-sm text-ink-500">
                Review submissions and update status to keep the queue moving.
              </div>
            </div>
            <Link href="/vendor-proposals" className="btn-primary">
              Review now
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Stat({
  label,
  value,
  href,
  highlight,
}: {
  label: string;
  value: number;
  href?: string;
  highlight?: boolean;
}) {
  const inner = (
    <div className={`card ${highlight ? 'border-primary/40 bg-primary/5' : ''}`}>
      <div className="text-xs uppercase tracking-wide text-ink-500">{label}</div>
      <div className="mt-2 text-3xl font-bold">{value}</div>
    </div>
  );
  return href ? (
    <Link href={href} className="block hover:opacity-90">
      {inner}
    </Link>
  ) : (
    inner
  );
}
