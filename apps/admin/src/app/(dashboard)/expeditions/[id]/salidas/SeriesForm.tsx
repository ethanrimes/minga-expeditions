'use client';

import { useActionState, useState } from 'react';
import { createSalidaSeriesAction, type SeriesFormState } from './actions';

interface Props {
  expeditionId: string;
  labels: {
    frequency: string;
    daily: string;
    weekly: string;
    monthly: string;
    interval: string;
    until: string;
    daysOfWeek: string;
    weekdayHelp: string;
    firstStart: string;
    firstEnd: string;
    capacity: string;
    capacityPlaceholder: string;
    priceCents: string;
    pricePlaceholder: string;
    currency: string;
    notes: string;
    publishImmediately: string;
    created: string;
    occurrences: string;
    creating: string;
    create: string;
    weekdays: string[];
  };
}

const WEEKDAYS = [
  { value: 0 },
  { value: 1 },
  { value: 2 },
  { value: 3 },
  { value: 4 },
  { value: 5 },
  { value: 6 },
];

const initialState: SeriesFormState = {};

export function SeriesForm({ expeditionId, labels }: Props) {
  const action = createSalidaSeriesAction.bind(null, expeditionId);
  const [state, formAction, pending] = useActionState(action, initialState);
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'monthly'>('weekly');

  return (
    <form action={formAction} className="card flex flex-col gap-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <label className="field">
          <span className="field-label">{labels.frequency}</span>
          <select
            name="frequency"
            value={frequency}
            onChange={(e) => setFrequency(e.target.value as 'daily' | 'weekly' | 'monthly')}
            className="field-input"
            data-testid="series-frequency"
          >
            <option value="daily">{labels.daily}</option>
            <option value="weekly">{labels.weekly}</option>
            <option value="monthly">{labels.monthly}</option>
          </select>
        </label>
        <label className="field">
          <span className="field-label">{labels.interval}</span>
          <input
            name="interval_count"
            type="number"
            min={1}
            max={365}
            defaultValue={1}
            required
            className="field-input"
          />
        </label>
        <label className="field">
          <span className="field-label">{labels.until}</span>
          <input name="series_until" type="date" className="field-input" />
        </label>
      </div>

      {frequency === 'weekly' ? (
        <fieldset className="field">
          <span className="field-label">{labels.daysOfWeek}</span>
          <div className="flex flex-wrap gap-2 mt-1">
            {WEEKDAYS.map((d) => (
              <label
                key={d.value}
                className="flex items-center gap-1 text-xs px-2 py-1 rounded border border-surface-border cursor-pointer hover:bg-surface-alt"
              >
                <input type="checkbox" name="by_weekday" value={d.value} className="h-3 w-3" />
                {labels.weekdays[d.value]}
              </label>
            ))}
          </div>
          <span className="text-xs text-ink-500 mt-1">
            {labels.weekdayHelp}
          </span>
        </fieldset>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <label className="field">
          <span className="field-label">{labels.firstStart}</span>
          <input
            name="starts_at"
            type="datetime-local"
            required
            className="field-input"
            data-testid="series-starts"
          />
        </label>
        <label className="field">
          <span className="field-label">{labels.firstEnd}</span>
          <input name="ends_at" type="datetime-local" className="field-input" />
        </label>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <label className="field">
          <span className="field-label">{labels.capacity}</span>
          <input
            name="capacity"
            type="number"
            min={1}
            className="field-input"
            placeholder={labels.capacityPlaceholder}
          />
        </label>
        <label className="field">
          <span className="field-label">{labels.priceCents}</span>
          <input
            name="price_cents"
            type="number"
            min={1}
            className="field-input"
            placeholder={labels.pricePlaceholder}
          />
        </label>
        <label className="field">
          <span className="field-label">{labels.currency}</span>
          <input name="currency" className="field-input" placeholder="COP" />
        </label>
      </div>

      <input type="hidden" name="timezone" value="America/Bogota" />

      <label className="field">
        <span className="field-label">{labels.notes}</span>
        <textarea name="notes" rows={2} className="field-input resize-y" />
      </label>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="is_published" defaultChecked className="h-4 w-4" />
        <span>{labels.publishImmediately}</span>
      </label>

      {state.error ? <p className="text-xs text-danger">{state.error}</p> : null}
      {state.created ? (
        <p className="text-xs text-success">
          {labels.created} {state.created} {labels.occurrences}
        </p>
      ) : null}

      <button type="submit" disabled={pending} className="btn-primary text-sm self-start">
        {pending ? labels.creating : labels.create}
      </button>
    </form>
  );
}
