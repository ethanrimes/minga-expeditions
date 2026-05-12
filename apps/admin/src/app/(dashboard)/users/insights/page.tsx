import { createSupabaseServerClient } from '@/lib/supabase/server';
import { InsightsCharts } from './InsightsCharts';

interface SignupBucket {
  day: string;
  count: number;
}

async function loadInsights(supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>) {
  // 30-day window for the trend charts. Use the unscoped admin reads (RLS
  // policies grant admins broad read access; see migration 20260508000100).
  const since = new Date(Date.now() - 30 * 86400_000).toISOString();

  const [profilesRes, ordersRes, tiersRes, approvedRevenue] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, created_at')
      .gte('created_at', since)
      .order('created_at', { ascending: true }),
    supabase
      .from('orders')
      .select('id, status, amount_cents, created_at')
      .gte('created_at', since),
    supabase
      .from('profiles')
      .select('tier'),
    supabase
      .from('orders')
      .select('amount_cents, currency')
      .eq('status', 'approved'),
  ]);

  const profiles = (profilesRes.data ?? []) as Array<{ id: string; created_at: string }>;
  const orders = (ordersRes.data ?? []) as Array<{ id: string; status: string; amount_cents: number; created_at: string }>;
  const tiers = (tiersRes.data ?? []) as Array<{ tier: string }>;
  const revenueRows = (approvedRevenue.data ?? []) as Array<{ amount_cents: number; currency: string }>;

  // Day-bucket signups + bookings.
  const signupsByDay = new Map<string, number>();
  const bookingsByDay = new Map<string, number>();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400_000);
    const key = d.toISOString().slice(0, 10);
    signupsByDay.set(key, 0);
    bookingsByDay.set(key, 0);
  }
  for (const p of profiles) {
    const day = p.created_at.slice(0, 10);
    if (signupsByDay.has(day)) signupsByDay.set(day, (signupsByDay.get(day) ?? 0) + 1);
  }
  for (const o of orders) {
    const day = o.created_at.slice(0, 10);
    if (bookingsByDay.has(day)) bookingsByDay.set(day, (bookingsByDay.get(day) ?? 0) + 1);
  }
  const signupSeries: SignupBucket[] = [...signupsByDay.entries()].map(([day, count]) => ({ day, count }));
  const bookingSeries: SignupBucket[] = [...bookingsByDay.entries()].map(([day, count]) => ({ day, count }));

  const tierCounts = { bronze: 0, silver: 0, gold: 0, diamond: 0 };
  for (const t of tiers) {
    if (t.tier in tierCounts) tierCounts[t.tier as keyof typeof tierCounts]++;
  }

  const orderStatusCounts: Record<string, number> = {};
  for (const o of orders) orderStatusCounts[o.status] = (orderStatusCounts[o.status] ?? 0) + 1;

  // Sum revenue per currency.
  const revenueByCurrency: Record<string, number> = {};
  for (const r of revenueRows) {
    revenueByCurrency[r.currency] = (revenueByCurrency[r.currency] ?? 0) + r.amount_cents;
  }

  return {
    totalProfiles30d: profiles.length,
    totalOrders30d: orders.length,
    tierCounts,
    orderStatusCounts,
    revenueByCurrency,
    signupSeries,
    bookingSeries,
    totalProfiles: tiers.length,
  };
}

export default async function UsersInsightsPage() {
  const supabase = await createSupabaseServerClient();
  const data = await loadInsights(supabase);

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-bold">Insights</h1>
        <p className="text-sm text-ink-500 mt-1 max-w-2xl">
          Last 30 days of activity. Charts are sampled from the live tables; refresh to update.
        </p>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Total users" value={String(data.totalProfiles)} />
        <Stat label="Signups (30d)" value={String(data.totalProfiles30d)} />
        <Stat label="Orders (30d)" value={String(data.totalOrders30d)} />
        <Stat
          label="Approved revenue"
          value={
            Object.keys(data.revenueByCurrency).length === 0
              ? '—'
              : Object.entries(data.revenueByCurrency)
                  .map(([cur, cents]) => `${(cents / 100).toLocaleString()} ${cur}`)
                  .join(' · ')
          }
        />
      </div>

      <InsightsCharts
        signupSeries={data.signupSeries}
        bookingSeries={data.bookingSeries}
        tierCounts={data.tierCounts}
        orderStatusCounts={data.orderStatusCounts}
      />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="card">
      <div className="text-xs uppercase tracking-wider text-ink-500 font-bold">{label}</div>
      <div className="text-2xl font-bold mt-1" data-testid={`stat-${label.toLowerCase().replace(/\s+/g, '-')}`}>
        {value}
      </div>
    </div>
  );
}
