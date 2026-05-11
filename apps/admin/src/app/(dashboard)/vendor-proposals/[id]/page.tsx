import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { ProposalStatus, VendorType } from '@minga/types';
import { getVendorProposal } from '@minga/supabase';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getT } from '@/lib/i18n/server';
import type { Key } from '@/lib/i18n/dictionary';
import { updateProposalNotes, updateProposalStatus } from '../actions';

const TYPE_KEY: Record<VendorType, Key> = {
  full_experience: 'proposals.type.full_experience',
  transportation: 'proposals.type.transportation',
  lodging: 'proposals.type.lodging',
  guide: 'proposals.type.guide',
  food: 'proposals.type.food',
  other: 'proposals.type.other',
};

const STATUS_KEY: Record<ProposalStatus, Key> = {
  new: 'proposals.status.new',
  reviewing: 'proposals.status.reviewing',
  accepted: 'proposals.status.accepted',
  rejected: 'proposals.status.rejected',
  archived: 'proposals.status.archived',
};

const STATUSES: ProposalStatus[] = ['new', 'reviewing', 'accepted', 'rejected', 'archived'];

export default async function VendorProposalDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const proposal = await getVendorProposal(supabase, id);
  if (!proposal) notFound();
  const { t, locale } = await getT();

  const dateLocale = locale === 'es' ? 'es-CO' : 'en-US';

  return (
    <div>
      <Link href="/vendor-proposals" className="text-sm text-ink-500 hover:text-ink-700">
        {t('proposalDetail.back')}
      </Link>

      <header className="mt-3 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">{proposal.title}</h1>
          <p className="text-ink-500 mt-1">
            {t(TYPE_KEY[proposal.vendor_type])}
            {proposal.region ? ` · ${proposal.region}` : ''}
          </p>
        </div>
        <div className="text-right text-sm">
          <div className="text-ink-500">{t('proposalDetail.submitted')}</div>
          <div>{new Date(proposal.created_at).toLocaleString(dateLocale)}</div>
        </div>
      </header>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <section className="card">
            <h2 className="font-semibold mb-2">{t('proposalDetail.description')}</h2>
            <p className="text-sm whitespace-pre-line leading-relaxed">{proposal.description}</p>
          </section>

          {proposal.pricing_notes ? (
            <section className="card">
              <h2 className="font-semibold mb-2">{t('proposalDetail.pricingNotes')}</h2>
              <p className="text-sm whitespace-pre-line leading-relaxed">{proposal.pricing_notes}</p>
            </section>
          ) : null}

          {proposal.attachments_url ? (
            <section className="card">
              <h2 className="font-semibold mb-2">{t('proposalDetail.attachments')}</h2>
              <a
                href={proposal.attachments_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline break-all"
              >
                {proposal.attachments_url}
              </a>
            </section>
          ) : null}

          <section className="card">
            <h2 className="font-semibold mb-3">{t('proposalDetail.internalNotes')}</h2>
            <form action={updateProposalNotes} className="flex flex-col gap-3">
              <input type="hidden" name="id" value={proposal.id} />
              <textarea
                name="admin_notes"
                rows={5}
                defaultValue={proposal.admin_notes ?? ''}
                className="field-input resize-y"
                placeholder={t('proposalDetail.notesPlaceholder')}
              />
              <button type="submit" className="btn-primary self-start">
                {t('proposalDetail.saveNotes')}
              </button>
            </form>
          </section>
        </div>

        <aside className="space-y-6">
          <section className="card">
            <h2 className="font-semibold mb-3">{t('proposalDetail.vendor')}</h2>
            <dl className="text-sm grid grid-cols-1 gap-2">
              <Row label={t('proposalDetail.row.name')} value={proposal.vendor_name} />
              <Row label={t('proposalDetail.row.email')} value={proposal.contact_email ?? '—'} />
              <Row label={t('proposalDetail.row.phone')} value={proposal.contact_phone ?? '—'} />
            </dl>
          </section>

          <section className="card">
            <h2 className="font-semibold mb-3">{t('proposalDetail.statusTitle')}</h2>
            <form action={updateProposalStatus} className="flex flex-col gap-3">
              <input type="hidden" name="id" value={proposal.id} />
              <select
                name="status"
                defaultValue={proposal.status}
                className="field-input"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {t(STATUS_KEY[s])}
                  </option>
                ))}
              </select>
              <button type="submit" className="btn-primary">
                {t('proposalDetail.updateStatus')}
              </button>
            </form>
            {proposal.reviewed_at ? (
              <p className="text-xs text-ink-500 mt-3">
                {t('proposalDetail.lastReviewed')} {new Date(proposal.reviewed_at).toLocaleString(dateLocale)}
              </p>
            ) : null}
          </section>
        </aside>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-ink-500">{label}</dt>
      <dd className="text-ink-900 text-right break-all">{value}</dd>
    </div>
  );
}
