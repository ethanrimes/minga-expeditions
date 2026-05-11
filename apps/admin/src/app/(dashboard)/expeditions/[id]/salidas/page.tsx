import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Plus } from 'lucide-react';
import type { DbExpeditionSalida } from '@minga/types';
import { adminGetExpedition, adminListSalidas } from '@minga/supabase';
import { formatSalidaDate, isSoldOut, seatsRemaining } from '@minga/logic';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getT } from '@/lib/i18n/server';
import { SalidaForm } from './SalidaForm';
import { createSalidaAction, deleteSalidaAction } from './actions';

function formatPriceCents(price: number, currency: string) {
  if (!price) return '—';
  try {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency, maximumFractionDigits: 0 }).format(
      price / 100,
    );
  } catch {
    return `${currency} ${(price / 100).toFixed(2)}`;
  }
}

export default async function ExpeditionSalidasPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const [expedition, salidas] = await Promise.all([
    adminGetExpedition(supabase, id),
    adminListSalidas(supabase, { expeditionId: id, limit: 500 }),
  ]);
  if (!expedition) notFound();
  const { t, locale } = await getT();
  const dateLocale = locale === 'es' ? 'es-CO' : 'en-US';

  const action = createSalidaAction.bind(null, id);

  return (
    <div>
      <header className="flex items-center justify-between gap-4">
        <div>
          <Link href={`/expeditions/${id}`} className="text-xs text-ink-500 hover:underline">
            {t('salidas.back')}
          </Link>
          <h1 className="text-2xl font-bold mt-1">{t('salidas.title')}</h1>
          <p className="text-ink-500 mt-1 text-sm">{expedition.title}</p>
          <p className="text-ink-500 mt-2 text-sm max-w-xl">{t('salidas.subtitle')}</p>
        </div>
      </header>

      <section className="mt-8 card p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface-alt text-left text-xs uppercase tracking-wide text-ink-500">
            <tr>
              <th className="px-4 py-3">{t('salidas.col.starts')}</th>
              <th className="px-4 py-3">{t('salidas.col.ends')}</th>
              <th className="px-4 py-3">{t('salidas.col.capacity')}</th>
              <th className="px-4 py-3">{t('salidas.col.seats')}</th>
              <th className="px-4 py-3">{t('salidas.col.price')}</th>
              <th className="px-4 py-3">{t('salidas.col.status')}</th>
              <th className="px-4 py-3 text-right">{t('salidas.col.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {salidas.map((s: DbExpeditionSalida) => {
              const remaining = seatsRemaining(s);
              const soldOut = isSoldOut(s);
              return (
                <tr key={s.id} className="border-t border-surface-border">
                  <td className="px-4 py-3 font-medium">
                    {formatSalidaDate(s.starts_at, { locale: dateLocale, tz: s.timezone, withTime: true })}
                  </td>
                  <td className="px-4 py-3 text-ink-500">
                    {s.ends_at
                      ? formatSalidaDate(s.ends_at, { locale: dateLocale, tz: s.timezone, withTime: true })
                      : '—'}
                  </td>
                  <td className="px-4 py-3 text-ink-500">
                    {s.capacity == null ? t('salidas.unlimited') : s.capacity}
                  </td>
                  <td className="px-4 py-3 text-ink-500">
                    {s.seats_taken}
                    {remaining != null ? <span className="text-ink-300"> · -{remaining}</span> : null}
                  </td>
                  <td className="px-4 py-3 text-ink-500">
                    {s.price_cents == null
                      ? t('salidas.inheritsPrice')
                      : formatPriceCents(s.price_cents, s.currency ?? expedition.currency)}
                  </td>
                  <td className="px-4 py-3">
                    <StatusPill
                      tone={soldOut ? 'danger' : s.is_published ? 'success' : 'muted'}
                      label={
                        soldOut
                          ? t('salidas.status.soldOut')
                          : s.is_published
                            ? t('salidas.status.published')
                            : t('salidas.status.draft')
                      }
                    />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex gap-2">
                      <Link href={`/expeditions/${id}/salidas/${s.id}`} className="btn-secondary text-xs">
                        {t('categories.action.edit')}
                      </Link>
                      <form action={deleteSalidaAction}>
                        <input type="hidden" name="id" value={s.id} />
                        <input type="hidden" name="expedition_id" value={id} />
                        <button type="submit" className="btn-secondary text-xs text-danger hover:bg-danger/10">
                          {t('categories.action.delete')}
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              );
            })}
            {salidas.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-ink-500">
                  {t('salidas.empty')}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Plus size={16} /> {t('salidas.new')}
        </h2>
        <div className="mt-4">
          <SalidaForm
            action={action}
            backHref={`/expeditions/${id}`}
            templatePriceCents={expedition.price_cents}
            templateCurrency={expedition.currency}
            labels={{
              starts: t('salidaForm.starts'),
              ends: t('salidaForm.ends'),
              timezone: t('salidaForm.timezone'),
              capacity: t('salidaForm.capacity'),
              capacityHelp: t('salidaForm.capacityHelp'),
              seatsTaken: t('salidaForm.seatsTaken'),
              seatsHelp: t('salidaForm.seatsHelp'),
              priceCents: t('salidaForm.priceCents'),
              priceHelp: t('salidaForm.priceHelp'),
              currency: t('salidaForm.currency'),
              notes: t('salidaForm.notes'),
              published: t('salidaForm.published'),
              saving: t('salidaForm.saving'),
              cancel: t('salidaForm.cancel'),
              submit: t('salidas.newPage.submit'),
            }}
          />
        </div>
      </section>
    </div>
  );
}

function StatusPill({ tone, label }: { tone: 'success' | 'muted' | 'danger'; label: string }) {
  const className =
    tone === 'success'
      ? 'inline-flex rounded-full bg-success/10 text-success px-2 py-0.5 text-xs font-semibold'
      : tone === 'danger'
        ? 'inline-flex rounded-full bg-danger/10 text-danger px-2 py-0.5 text-xs font-semibold'
        : 'inline-flex rounded-full bg-ink-300/20 text-ink-500 px-2 py-0.5 text-xs font-semibold';
  return <span className={className}>{label}</span>;
}
