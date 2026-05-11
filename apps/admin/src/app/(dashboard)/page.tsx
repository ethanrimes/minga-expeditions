import Link from 'next/link';
import { orderCounts, vendorProposalCounts } from '@minga/supabase';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getT } from '@/lib/i18n/server';

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
  const { t } = await getT();
  const newProposals = c.proposals.new;
  const unreviewedLabel =
    newProposals === 1
      ? t('dashboard.unreviewedOne', { n: newProposals })
      : t('dashboard.unreviewedMany', { n: newProposals });

  return (
    <div>
      <h1 className="text-2xl font-bold">{t('dashboard.title')}</h1>
      <p className="text-ink-500 mt-1">{t('dashboard.subtitle')}</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
        <Stat label={t('dashboard.stat.expeditions')} value={c.expeditions} href="/expeditions" />
        <Stat label={t('dashboard.stat.categories')} value={c.categories} href="/categories" />
        <Stat label={t('dashboard.stat.profiles')} value={c.profiles} />
        <Stat
          label={t('dashboard.stat.newProposals')}
          value={newProposals}
          href="/vendor-proposals"
          highlight={newProposals > 0}
        />
        <Stat label={t('dashboard.stat.approvedOrders')} value={c.orders.approved} href="/orders?status=approved" />
        <Stat
          label={t('dashboard.stat.pendingOrders')}
          value={c.orders.pending}
          href="/orders?status=pending"
          highlight={c.orders.pending > 0}
        />
        <Stat label={t('dashboard.stat.declinedOrders')} value={c.orders.declined} href="/orders?status=declined" />
      </div>

      {newProposals > 0 ? (
        <div className="mt-6 card border-primary/40 bg-primary/5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="font-semibold">{unreviewedLabel}</div>
              <div className="text-sm text-ink-500">{t('dashboard.unreviewedBody')}</div>
            </div>
            <Link href="/vendor-proposals" className="btn-primary">
              {t('dashboard.reviewNow')}
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
