'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import type { DbProvider, VendorType } from '@minga/types';

const VENDOR_TYPES: VendorType[] = [
  'full_experience',
  'transportation',
  'lodging',
  'guide',
  'food',
  'other',
];

export function ProvidersTable({
  providers,
  initialSearch,
  initialType,
  labels,
}: {
  providers: DbProvider[];
  initialSearch: string;
  initialType: string;
  labels: {
    search: string;
    namePlaceholder: string;
    vendorType: string;
    all: string;
    apply: string;
    empty: string;
    name: string;
    type: string;
    region: string;
    contact: string;
    status: string;
    active: string;
    inactive: string;
    vendorTypes: Record<VendorType, string>;
  };
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [q, setQ] = useState(initialSearch);
  const [type, setType] = useState(initialType);

  const applyFilters = (next: { q?: string; type?: string }) => {
    const params = new URLSearchParams(searchParams ?? undefined);
    if (next.q !== undefined) {
      if (next.q) params.set('q', next.q);
      else params.delete('q');
    }
    if (next.type !== undefined) {
      if (next.type) params.set('type', next.type);
      else params.delete('type');
    }
    router.replace(`/providers?${params.toString()}`);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end gap-3">
        <label className="field flex-1 min-w-[200px]">
          <span className="field-label">{labels.search}</span>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') applyFilters({ q });
            }}
            placeholder={labels.namePlaceholder}
            className="field-input"
            data-testid="providers-search"
          />
        </label>
        <label className="field">
          <span className="field-label">{labels.vendorType}</span>
          <select
            value={type}
            onChange={(e) => {
              setType(e.target.value);
              applyFilters({ type: e.target.value });
            }}
            className="field-input"
          >
            <option value="">{labels.all}</option>
            {VENDOR_TYPES.map((vt) => (
              <option key={vt} value={vt}>
                {labels.vendorTypes[vt]}
              </option>
            ))}
          </select>
        </label>
        <button onClick={() => applyFilters({ q })} className="btn-secondary text-sm">
          {labels.apply}
        </button>
      </div>

      {providers.length === 0 ? (
        <p className="text-sm text-ink-500">{labels.empty}</p>
      ) : (
        <div className="border border-surface-border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-surface-alt text-xs uppercase tracking-wider text-ink-500">
              <tr>
                <th className="text-left px-3 py-2">{labels.name}</th>
                <th className="text-left px-3 py-2">{labels.type}</th>
                <th className="text-left px-3 py-2">{labels.region}</th>
                <th className="text-left px-3 py-2">{labels.contact}</th>
                <th className="text-left px-3 py-2">{labels.status}</th>
              </tr>
            </thead>
            <tbody>
              {providers.map((p) => (
                <tr
                  key={p.id}
                  className="border-t border-surface-border hover:bg-surface-alt"
                  data-testid={`provider-row-${p.id}`}
                >
                  <td className="px-3 py-2">
                    <Link href={`/providers/${p.id}`} className="font-semibold text-primary">
                      {p.display_name}
                    </Link>
                  </td>
                  <td className="px-3 py-2 text-ink-700">
                    {p.vendor_type ? labels.vendorTypes[p.vendor_type] : '—'}
                  </td>
                  <td className="px-3 py-2 text-ink-700">{p.region ?? '—'}</td>
                  <td className="px-3 py-2 text-ink-700">
                    {p.contact_email ?? p.contact_phone ?? p.whatsapp ?? '—'}
                  </td>
                  <td className="px-3 py-2 text-ink-700">
                    {p.is_active ? (
                      <span className="text-xs uppercase tracking-wider font-bold text-success">
                        {labels.active}
                      </span>
                    ) : (
                      <span className="text-xs uppercase tracking-wider font-bold text-ink-500">
                        {labels.inactive}
                      </span>
                    )}
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
