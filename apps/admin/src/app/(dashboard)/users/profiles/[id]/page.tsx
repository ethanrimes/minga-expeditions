import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  fetchProfile,
  fetchProfileTripsForAdmin,
  fetchOrganizerReviewsForUser,
  fetchUserCommSubscriptions,
} from '@minga/supabase';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export default async function ProfileDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const [profile, trips, reviews, subs] = await Promise.all([
    fetchProfile(supabase, id),
    fetchProfileTripsForAdmin(supabase, id),
    fetchOrganizerReviewsForUser(supabase, id),
    fetchUserCommSubscriptions(supabase, id),
  ]);
  if (!profile) notFound();

  // Group subscriptions per event for compact display.
  const subsByEvent = new Map<string, Array<{ channel: string; is_subscribed: boolean }>>();
  for (const s of subs) {
    const list = subsByEvent.get(s.event_key) ?? [];
    list.push({ channel: s.channel, is_subscribed: s.is_subscribed });
    subsByEvent.set(s.event_key, list);
  }

  return (
    <div className="flex flex-col gap-6">
      <Link href="/users/profiles" className="text-sm text-primary font-semibold">
        ← Back to profiles
      </Link>

      <header className="flex items-center gap-4">
        {profile.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={profile.avatar_url}
            alt=""
            className="w-16 h-16 rounded-full bg-surface-alt"
          />
        ) : (
          <div className="w-16 h-16 rounded-full bg-surface-alt" />
        )}
        <div>
          <h1 className="text-2xl font-bold">{profile.display_name}</h1>
          <div className="text-sm text-ink-500">
            @{profile.username} · {profile.home_country ?? '—'} ·{' '}
            <span className="uppercase font-bold">{profile.tier}</span>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <section className="card flex flex-col gap-2">
          <h2 className="font-bold">Contact</h2>
          <Row label="Bio" value={profile.bio ?? '—'} />
          <Row label="Instagram" value={profile.instagram_handle ?? '—'} />
          <Row
            label="Joined"
            value={new Date(profile.created_at).toLocaleDateString()}
          />
          <Row label="Total distance" value={`${profile.total_distance_km.toFixed(1)} km`} />
          <Row label="Total elevation" value={`${profile.total_elevation_m.toFixed(0)} m`} />
        </section>

        <section className="card flex flex-col gap-2">
          <h2 className="font-bold">Comms subscriptions</h2>
          {subsByEvent.size === 0 ? (
            <p className="text-sm text-ink-500 italic">Default (subscribed to everything).</p>
          ) : (
            <ul className="text-sm flex flex-col gap-1">
              {[...subsByEvent.entries()].map(([eventKey, rows]) => (
                <li key={eventKey} className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs text-ink-700">{eventKey}</span>
                  <span className="flex gap-1 text-[10px] uppercase tracking-wider font-bold">
                    {rows.map((r) => (
                      <span
                        key={r.channel}
                        className={[
                          'px-1.5 py-0.5 rounded border',
                          r.is_subscribed
                            ? 'bg-success/10 text-success border-success/30'
                            : 'bg-danger/10 text-danger border-danger/30',
                        ].join(' ')}
                      >
                        {r.channel} {r.is_subscribed ? '✓' : '✗'}
                      </span>
                    ))}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="card flex flex-col gap-2">
        <h2 className="font-bold">Trips ({trips.length})</h2>
        {trips.length === 0 ? (
          <p className="text-sm text-ink-500 italic">No bookings yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-surface-alt text-xs uppercase tracking-wider text-ink-500">
              <tr>
                <th className="text-left px-3 py-2">Expedition</th>
                <th className="text-left px-3 py-2">Date</th>
                <th className="text-left px-3 py-2">Status</th>
                <th className="text-left px-3 py-2">Amount</th>
              </tr>
            </thead>
            <tbody>
              {trips.map((t) => (
                <tr key={t.order_id} className="border-t border-surface-border">
                  <td className="px-3 py-2 text-ink-700">{t.expedition?.title ?? '—'}</td>
                  <td className="px-3 py-2 text-ink-700">
                    {t.salida?.starts_at ? new Date(t.salida.starts_at).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-3 py-2 text-ink-700 uppercase text-xs font-bold">
                    {t.status}
                  </td>
                  <td className="px-3 py-2 text-ink-700">
                    {(t.amount_cents / 100).toLocaleString()} {t.currency}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="card flex flex-col gap-2">
        <h2 className="font-bold">Reviews received from providers ({reviews.length})</h2>
        {reviews.length === 0 ? (
          <p className="text-sm text-ink-500 italic">No reviews yet.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {reviews.map((r) => (
              <li key={r.id} className="border-t border-surface-border pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">{r.expedition_title ?? '—'}</span>
                  <span className="text-xs text-ink-500">
                    {r.reviewed_at ? new Date(r.reviewed_at).toLocaleDateString() : '—'}
                  </span>
                </div>
                <div className="text-yellow-500 text-sm">
                  {'★'.repeat(r.stars)}
                  {'☆'.repeat(5 - r.stars)}
                </div>
                {r.body ? <p className="text-sm text-ink-700 mt-1">{r.body}</p> : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-2 text-sm">
      <span className="text-ink-500">{label}</span>
      <span className="text-ink-700">{value}</span>
    </div>
  );
}
