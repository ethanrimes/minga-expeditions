import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { ProposalStatus, VendorType } from '@minga/types';
import { getVendorProposal } from '@minga/supabase';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { updateProposalNotes, updateProposalStatus } from '../actions';

const TYPE_LABEL: Record<VendorType, string> = {
  full_experience: 'Full experience',
  transportation: 'Transportation',
  lodging: 'Lodging',
  guide: 'Guide',
  food: 'Food',
  other: 'Other',
};

const STATUS_LABEL: Record<ProposalStatus, string> = {
  new: 'New',
  reviewing: 'In review',
  accepted: 'Accepted',
  rejected: 'Rejected',
  archived: 'Archived',
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

  return (
    <div>
      <Link href="/vendor-proposals" className="text-sm text-ink-500 hover:text-ink-700">
        ← Back to proposals
      </Link>

      <header className="mt-3 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">{proposal.title}</h1>
          <p className="text-ink-500 mt-1">
            {TYPE_LABEL[proposal.vendor_type]}
            {proposal.region ? ` · ${proposal.region}` : ''}
          </p>
        </div>
        <div className="text-right text-sm">
          <div className="text-ink-500">Submitted</div>
          <div>{new Date(proposal.created_at).toLocaleString()}</div>
        </div>
      </header>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <section className="card">
            <h2 className="font-semibold mb-2">Description</h2>
            <p className="text-sm whitespace-pre-line leading-relaxed">{proposal.description}</p>
          </section>

          {proposal.pricing_notes ? (
            <section className="card">
              <h2 className="font-semibold mb-2">Pricing notes</h2>
              <p className="text-sm whitespace-pre-line leading-relaxed">{proposal.pricing_notes}</p>
            </section>
          ) : null}

          {proposal.attachments_url ? (
            <section className="card">
              <h2 className="font-semibold mb-2">Attachments</h2>
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
            <h2 className="font-semibold mb-3">Internal notes</h2>
            <form action={updateProposalNotes} className="flex flex-col gap-3">
              <input type="hidden" name="id" value={proposal.id} />
              <textarea
                name="admin_notes"
                rows={5}
                defaultValue={proposal.admin_notes ?? ''}
                className="field-input resize-y"
                placeholder="Visible only to admins. Outcome of phone calls, follow-ups, decision rationale, etc."
              />
              <button type="submit" className="btn-primary self-start">
                Save notes
              </button>
            </form>
          </section>
        </div>

        <aside className="space-y-6">
          <section className="card">
            <h2 className="font-semibold mb-3">Vendor</h2>
            <dl className="text-sm grid grid-cols-1 gap-2">
              <Row label="Name" value={proposal.vendor_name} />
              <Row label="Email" value={proposal.contact_email ?? '—'} />
              <Row label="Phone" value={proposal.contact_phone ?? '—'} />
            </dl>
          </section>

          <section className="card">
            <h2 className="font-semibold mb-3">Status</h2>
            <form action={updateProposalStatus} className="flex flex-col gap-3">
              <input type="hidden" name="id" value={proposal.id} />
              <select
                name="status"
                defaultValue={proposal.status}
                className="field-input"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABEL[s]}
                  </option>
                ))}
              </select>
              <button type="submit" className="btn-primary">
                Update status
              </button>
            </form>
            {proposal.reviewed_at ? (
              <p className="text-xs text-ink-500 mt-3">
                Last reviewed {new Date(proposal.reviewed_at).toLocaleString()}
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
