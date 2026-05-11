import Link from 'next/link';
import type { DbVendorProposal, ProposalStatus, VendorType } from '@minga/types';
import { listVendorProposals } from '@minga/supabase';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getT } from '@/lib/i18n/server';
import type { Key } from '@/lib/i18n/dictionary';

const STATUSES: (ProposalStatus | 'all')[] = ['new', 'reviewing', 'accepted', 'rejected', 'archived', 'all'];

const STATUS_KEY: Record<ProposalStatus | 'all', Key> = {
  new: 'proposals.status.new',
  reviewing: 'proposals.status.reviewing',
  accepted: 'proposals.status.accepted',
  rejected: 'proposals.status.rejected',
  archived: 'proposals.status.archived',
  all: 'proposals.status.all',
};

const TYPE_KEY: Record<VendorType, Key> = {
  full_experience: 'proposals.type.full_experience',
  transportation: 'proposals.type.transportation',
  lodging: 'proposals.type.lodging',
  guide: 'proposals.type.guide',
  food: 'proposals.type.food',
  other: 'proposals.type.other',
};

const STATUS_PILL: Record<ProposalStatus, string> = {
  new: 'bg-primary/10 text-primary',
  reviewing: 'bg-amber-100 text-amber-800',
  accepted: 'bg-success/10 text-success',
  rejected: 'bg-danger/10 text-danger',
  archived: 'bg-ink-300/20 text-ink-500',
};

function formatDate(iso: string, locale: 'en' | 'es') {
  return new Date(iso).toLocaleDateString(locale === 'es' ? 'es-CO' : 'en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default async function VendorProposalsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const params = await searchParams;
  const filter = (params.status as ProposalStatus | 'all') || 'new';

  const supabase = await createSupabaseServerClient();
  const proposals = await listVendorProposals(supabase, { status: filter });
  const { t, locale } = await getT();

  return (
    <div>
      <header>
        <h1 className="text-2xl font-bold">{t('proposals.title')}</h1>
        <p className="text-ink-500 mt-1">{t('proposals.subtitle')}</p>
      </header>

      <nav className="mt-6 flex flex-wrap gap-1 text-sm" aria-label={t('proposals.statusFilter')}>
        {STATUSES.map((s) => {
          const active = filter === s;
          return (
            <Link
              key={s}
              href={`/vendor-proposals?status=${s}`}
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
              <th className="px-4 py-3">{t('proposals.col.vendor')}</th>
              <th className="px-4 py-3">{t('proposals.col.type')}</th>
              <th className="px-4 py-3">{t('proposals.col.title')}</th>
              <th className="px-4 py-3">{t('proposals.col.region')}</th>
              <th className="px-4 py-3">{t('proposals.col.submitted')}</th>
              <th className="px-4 py-3">{t('proposals.col.status')}</th>
              <th className="px-4 py-3 text-right">{t('proposals.col.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {proposals.map((p: DbVendorProposal) => (
              <tr key={p.id} className="border-t border-surface-border">
                <td className="px-4 py-3 font-medium">
                  {p.vendor_name}
                  <div className="text-xs text-ink-500 font-normal">
                    {p.contact_email ?? p.contact_phone}
                  </div>
                </td>
                <td className="px-4 py-3 text-ink-700">{t(TYPE_KEY[p.vendor_type])}</td>
                <td className="px-4 py-3 max-w-md truncate" title={p.title}>
                  {p.title}
                </td>
                <td className="px-4 py-3 text-ink-500">{p.region ?? '—'}</td>
                <td className="px-4 py-3 text-ink-500 whitespace-nowrap">{formatDate(p.created_at, locale)}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_PILL[p.status]}`}
                  >
                    {t(STATUS_KEY[p.status])}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/vendor-proposals/${p.id}`} className="btn-secondary text-xs">
                    {t('proposals.review')}
                  </Link>
                </td>
              </tr>
            ))}
            {proposals.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-ink-500">
                  {t('proposals.empty')}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
