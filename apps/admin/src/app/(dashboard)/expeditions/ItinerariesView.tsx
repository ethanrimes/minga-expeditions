'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMemo, useState } from 'react';
import type { AdminItineraryRow } from '@minga/supabase';
import type { DbProvider } from '@minga/types';

type GroupKey = 'category' | 'region' | 'status' | 'provider';

interface Props {
  itineraries: AdminItineraryRow[];
  categories: { id: string; label: string }[];
  providers: DbProvider[];
  regions: string[];
  catName: Record<string, string>;
  initial: {
    q: string;
    category: string;
    region: string;
    status: string;
    provider: string;
    group: GroupKey;
  };
}

function formatPrice(price: number, currency: string) {
  if (!price) return '—';
  const value = price / 100;
  try {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency, maximumFractionDigits: 0 }).format(
      value,
    );
  } catch {
    return `${currency} ${value.toFixed(0)}`;
  }
}

export function ItinerariesView({
  itineraries,
  categories,
  providers,
  regions,
  catName,
  initial,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [q, setQ] = useState(initial.q);
  const [category, setCategory] = useState(initial.category);
  const [region, setRegion] = useState(initial.region);
  const [status, setStatus] = useState(initial.status);
  const [provider, setProvider] = useState(initial.provider);
  const [group, setGroup] = useState<GroupKey>(initial.group);

  const applyFilters = (next: Partial<typeof initial>) => {
    const params = new URLSearchParams(searchParams ?? undefined);
    const merged = { q, category, region, status, provider, group, ...next };
    for (const k of Object.keys(merged) as (keyof typeof merged)[]) {
      const value = merged[k];
      if (value) params.set(k, String(value));
      else params.delete(k);
    }
    router.replace(`/expeditions?${params.toString()}`);
  };

  const providerName = useMemo(
    () => Object.fromEntries(providers.map((p) => [p.id, p.display_name])),
    [providers],
  );

  // Group rows by the chosen variable.
  const grouped = useMemo(() => {
    const map = new Map<string, AdminItineraryRow[]>();
    for (const row of itineraries) {
      let key: string;
      switch (group) {
        case 'category':
          key = catName[row.category_id] ?? '—';
          break;
        case 'region':
          key = row.region ?? '—';
          break;
        case 'status':
          key = row.is_published ? 'Published' : 'Draft';
          break;
        case 'provider':
          key = row.provider?.display_name ?? '— no provider —';
          break;
      }
      const list = map.get(key) ?? [];
      list.push(row);
      map.set(key, list);
    }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [itineraries, group, catName]);

  return (
    <div className="flex flex-col gap-4">
      <div className="card flex flex-wrap items-end gap-3">
        <label className="field flex-1 min-w-[200px]">
          <span className="field-label">Search</span>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') applyFilters({ q });
            }}
            className="field-input"
            placeholder="Title…"
            data-testid="itineraries-search"
          />
        </label>
        <label className="field">
          <span className="field-label">Category</span>
          <select
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              applyFilters({ category: e.target.value });
            }}
            className="field-input"
          >
            <option value="">All</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span className="field-label">Region</span>
          <select
            value={region}
            onChange={(e) => {
              setRegion(e.target.value);
              applyFilters({ region: e.target.value });
            }}
            className="field-input"
          >
            <option value="">All</option>
            {regions.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span className="field-label">Status</span>
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              applyFilters({ status: e.target.value });
            }}
            className="field-input"
          >
            <option value="">All</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
          </select>
        </label>
        <label className="field">
          <span className="field-label">Provider</span>
          <select
            value={provider}
            onChange={(e) => {
              setProvider(e.target.value);
              applyFilters({ provider: e.target.value });
            }}
            className="field-input"
          >
            <option value="">All</option>
            {providers.map((p) => (
              <option key={p.id} value={p.id}>
                {p.display_name}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span className="field-label">Group by</span>
          <select
            value={group}
            onChange={(e) => {
              const next = e.target.value as GroupKey;
              setGroup(next);
              applyFilters({ group: next });
            }}
            className="field-input"
            data-testid="itineraries-groupby"
          >
            <option value="category">Category</option>
            <option value="region">Region</option>
            <option value="status">Status</option>
            <option value="provider">Provider</option>
          </select>
        </label>
      </div>

      {grouped.length === 0 ? (
        <p className="text-sm text-ink-500">No itineraries match.</p>
      ) : null}

      {grouped.map(([groupLabel, rows]) => (
        <section key={groupLabel} className="flex flex-col gap-2">
          <h2 className="text-xs uppercase tracking-wider text-ink-500 font-bold">
            {groupLabel} · {rows.length}
          </h2>
          <div className="border border-surface-border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-surface-alt text-xs uppercase tracking-wider text-ink-500">
                <tr>
                  <th className="text-left px-3 py-2">Photo</th>
                  <th className="text-left px-3 py-2">Title</th>
                  <th className="text-left px-3 py-2">Region</th>
                  <th className="text-left px-3 py-2">Provider</th>
                  <th className="text-left px-3 py-2">Price</th>
                  <th className="text-left px-3 py-2">Date added</th>
                  <th className="text-left px-3 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((e) => (
                  <tr
                    key={e.id}
                    className="border-t border-surface-border hover:bg-surface-alt"
                    data-testid={`itinerary-row-${e.id}`}
                  >
                    <td className="px-3 py-2">
                      {e.cover_photo_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={e.cover_photo_url}
                          alt=""
                          className="w-10 h-10 rounded object-cover bg-surface-alt"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded bg-surface-alt" />
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <Link
                        href={`/expeditions/${e.id}`}
                        className="font-semibold text-primary"
                      >
                        {e.title}
                      </Link>
                      <div className="text-xs text-ink-500">{e.location_name}</div>
                    </td>
                    <td className="px-3 py-2 text-ink-700">{e.region ?? '—'}</td>
                    <td className="px-3 py-2 text-ink-700">
                      {e.provider?.display_name ?? (
                        <span className="text-ink-500 italic">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-ink-700">
                      {formatPrice(e.price_cents, e.currency)}
                    </td>
                    <td className="px-3 py-2 text-xs text-ink-500">
                      {new Date(e.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-3 py-2">
                      {e.is_published ? (
                        <span className="text-xs uppercase tracking-wider font-bold text-success">
                          Published
                        </span>
                      ) : (
                        <span className="text-xs uppercase tracking-wider font-bold text-ink-500">
                          Draft
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}
    </div>
  );
}
