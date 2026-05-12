'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import type { AdminProfileRow } from '@minga/supabase';
import type { TierLevel } from '@minga/types';

const TIERS: TierLevel[] = ['bronze', 'silver', 'gold', 'diamond'];

export function ProfilesTable({
  profiles,
  initialSearch,
  initialTier,
}: {
  profiles: AdminProfileRow[];
  initialSearch: string;
  initialTier: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [q, setQ] = useState(initialSearch);
  const [tier, setTier] = useState(initialTier);

  const apply = (next: { q?: string; tier?: string }) => {
    const params = new URLSearchParams(searchParams ?? undefined);
    if (next.q !== undefined) (next.q ? params.set('q', next.q) : params.delete('q'));
    if (next.tier !== undefined) (next.tier ? params.set('tier', next.tier) : params.delete('tier'));
    router.replace(`/users/profiles?${params.toString()}`);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end gap-3">
        <label className="field flex-1 min-w-[200px]">
          <span className="field-label">Search</span>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') apply({ q });
            }}
            className="field-input"
            placeholder="Name or username…"
            data-testid="profiles-search"
          />
        </label>
        <label className="field">
          <span className="field-label">Tier</span>
          <select
            value={tier}
            onChange={(e) => {
              setTier(e.target.value);
              apply({ tier: e.target.value });
            }}
            className="field-input"
          >
            <option value="">All</option>
            {TIERS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
        <button onClick={() => apply({ q })} className="btn-secondary text-sm">
          Apply
        </button>
      </div>

      {profiles.length === 0 ? (
        <p className="text-sm text-ink-500">No profiles match.</p>
      ) : (
        <div className="border border-surface-border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-surface-alt text-xs uppercase tracking-wider text-ink-500">
              <tr>
                <th className="text-left px-3 py-2">Name</th>
                <th className="text-left px-3 py-2">Username</th>
                <th className="text-left px-3 py-2">Tier</th>
                <th className="text-left px-3 py-2">Country</th>
                <th className="text-left px-3 py-2">Distance</th>
                <th className="text-left px-3 py-2">Joined</th>
              </tr>
            </thead>
            <tbody>
              {profiles.map((p) => (
                <tr
                  key={p.id}
                  className="border-t border-surface-border hover:bg-surface-alt"
                  data-testid={`profile-row-${p.id}`}
                >
                  <td className="px-3 py-2">
                    <Link href={`/users/profiles/${p.id}`} className="font-semibold text-primary">
                      {p.display_name}
                    </Link>
                  </td>
                  <td className="px-3 py-2 text-ink-700">@{p.username}</td>
                  <td className="px-3 py-2 text-ink-700 uppercase text-xs font-bold">{p.tier}</td>
                  <td className="px-3 py-2 text-ink-700">{p.home_country ?? '—'}</td>
                  <td className="px-3 py-2 text-ink-700">{p.total_distance_km.toFixed(0)} km</td>
                  <td className="px-3 py-2 text-ink-500 text-xs">
                    {new Date(p.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
