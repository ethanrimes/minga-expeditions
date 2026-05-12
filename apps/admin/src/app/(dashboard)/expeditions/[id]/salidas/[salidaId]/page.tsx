import { notFound } from 'next/navigation';
import { adminGetExpedition, fetchSalidaById } from '@minga/supabase';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getT } from '@/lib/i18n/server';
import { SalidaForm } from '../SalidaForm';
import { deleteSalidaSeriesAction, updateSalidaAction } from '../actions';

export default async function EditSalidaPage({
  params,
}: {
  params: Promise<{ id: string; salidaId: string }>;
}) {
  const { id, salidaId } = await params;
  const supabase = await createSupabaseServerClient();
  const [expedition, salida] = await Promise.all([
    adminGetExpedition(supabase, id),
    fetchSalidaById(supabase, salidaId),
  ]);
  if (!expedition || !salida) notFound();
  if (salida.expedition_id !== id) notFound();
  const { t } = await getT();

  const action = updateSalidaAction.bind(null, id, salidaId);

  return (
    <div>
      <h1 className="text-2xl font-bold">{t('salidas.editPage.title')}</h1>
      <p className="text-ink-500 mt-1 text-sm">{expedition.title}</p>

      {salida.series_id ? (
        <div className="mt-4 card bg-amber-50 border-amber-200">
          <p className="text-sm text-ink-700 mb-2">
            <strong>This date is part of a series.</strong> Editing below changes <em>just this one</em>.
            To remove the whole series and all its dates, use the button on the right.
          </p>
          <form
            action={deleteSalidaSeriesAction}
            onSubmit={(e) => {
              if (!confirm('Delete the entire series and all its occurrences?')) e.preventDefault();
            }}
            className="inline-flex"
          >
            <input type="hidden" name="series_id" value={salida.series_id} />
            <input type="hidden" name="expedition_id" value={id} />
            <button type="submit" className="btn-secondary text-xs text-danger">
              Delete whole series
            </button>
          </form>
        </div>
      ) : null}

      <div className="mt-8">
        <SalidaForm
          action={action}
          initial={salida}
          backHref={`/expeditions/${id}/salidas`}
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
            submit: t('salidas.editPage.submit'),
          }}
        />
      </div>
    </div>
  );
}
