'use client';

import { useActionState, useState } from 'react';
import { createSalidaSeriesAction, type SeriesFormState } from './actions';

interface Props {
  expeditionId: string;
}

const WEEKDAYS = [
  { value: 0, label: 'Sun' },
  { value: 1, label: 'Mon' },
  { value: 2, label: 'Tue' },
  { value: 3, label: 'Wed' },
  { value: 4, label: 'Thu' },
  { value: 5, label: 'Fri' },
  { value: 6, label: 'Sat' },
];

const initialState: SeriesFormState = {};

export function SeriesForm({ expeditionId }: Props) {
  const action = createSalidaSeriesAction.bind(null, expeditionId);
  const [state, formAction, pending] = useActionState(action, initialState);
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'monthly'>('weekly');

  return (
    <form action={formAction} className="card flex flex-col gap-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <label className="field">
          <span className="field-label">Frequency</span>
          <select
            name="frequency"
            value={frequency}
            onChange={(e) => setFrequency(e.target.value as 'daily' | 'weekly' | 'monthly')}
            className="field-input"
            data-testid="series-frequency"
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </label>
        <label className="field">
          <span className="field-label">Every (interval)</span>
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
          <span className="field-label">Until (date)</span>
          <input name="series_until" type="date" className="field-input" />
        </label>
      </div>

      {frequency === 'weekly' ? (
        <fieldset className="field">
          <span className="field-label">Days of week</span>
          <div className="flex flex-wrap gap-2 mt-1">
            {WEEKDAYS.map((d) => (
              <label
                key={d.value}
                className="flex items-center gap-1 text-xs px-2 py-1 rounded border border-surface-border cursor-pointer hover:bg-surface-alt"
              >
                <input type="checkbox" name="by_weekday" value={d.value} className="h-3 w-3" />
                {d.label}
              </label>
            ))}
          </div>
          <span className="text-xs text-ink-500 mt-1">
            Leave blank to use the weekday of the start date.
          </span>
        </fieldset>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <label className="field">
          <span className="field-label">First start (date + time) *</span>
          <input
            name="starts_at"
            type="datetime-local"
            required
            className="field-input"
            data-testid="series-starts"
          />
        </label>
        <label className="field">
          <span className="field-label">First end (date + time)</span>
          <input name="ends_at" type="datetime-local" className="field-input" />
        </label>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <label className="field">
          <span className="field-label">Capacity</span>
          <input
            name="capacity"
            type="number"
            min={1}
            className="field-input"
            placeholder="Unlimited"
          />
        </label>
        <label className="field">
          <span className="field-label">Price (cents)</span>
          <input
            name="price_cents"
            type="number"
            min={1}
            className="field-input"
            placeholder="Inherit from template"
          />
        </label>
        <label className="field">
          <span className="field-label">Currency</span>
          <input name="currency" className="field-input" placeholder="COP" />
        </label>
      </div>

      <input type="hidden" name="timezone" value="America/Bogota" />

      <label className="field">
        <span className="field-label">Notes</span>
        <textarea name="notes" rows={2} className="field-input resize-y" />
      </label>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="is_published" defaultChecked className="h-4 w-4" />
        <span>Publish all occurrences immediately</span>
      </label>

      {state.error ? <p className="text-xs text-danger">{state.error}</p> : null}
      {state.created ? (
        <p className="text-xs text-success">Created {state.created} occurrences ✓</p>
      ) : null}

      <button type="submit" disabled={pending} className="btn-primary text-sm self-start">
        {pending ? 'Creating…' : 'Create series'}
      </button>
    </form>
  );
}
