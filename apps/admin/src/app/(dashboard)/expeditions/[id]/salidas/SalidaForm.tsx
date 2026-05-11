'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import type { DbExpeditionSalida } from '@minga/types';
import type { SalidaFormState } from './actions';

interface Labels {
  starts: string;
  ends: string;
  timezone: string;
  capacity: string;
  capacityHelp: string;
  seatsTaken: string;
  seatsHelp: string;
  priceCents: string;
  priceHelp: string;
  currency: string;
  notes: string;
  published: string;
  saving: string;
  cancel: string;
  submit: string;
}

interface Props {
  action: (state: SalidaFormState, formData: FormData) => Promise<SalidaFormState>;
  initial?: Partial<DbExpeditionSalida>;
  backHref: string;
  labels: Labels;
  templatePriceCents: number;
  templateCurrency: string;
}

// Common Latin-American zones — extend as needed. The free-text input below
// keeps any IANA name acceptable; this dropdown is just a convenience.
const TIMEZONES = [
  'America/Bogota',
  'America/Mexico_City',
  'America/Lima',
  'America/Santiago',
  'America/Buenos_Aires',
  'America/Caracas',
  'America/Guayaquil',
  'America/La_Paz',
  'America/New_York',
  'Europe/Madrid',
  'UTC',
];

// Convert a stored UTC ISO string to the "YYYY-MM-DDTHH:mm" wall-clock value
// the datetime-local input expects, anchored to the salida's tz.
function isoToLocalInput(iso: string | null | undefined, tz: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const parts: Record<string, string> = {};
  for (const p of fmt.formatToParts(d)) if (p.type !== 'literal') parts[p.type] = p.value;
  // hour may come back as "24" at midnight in some locales — normalize.
  const hour = parts.hour === '24' ? '00' : parts.hour;
  return `${parts.year}-${parts.month}-${parts.day}T${hour}:${parts.minute}`;
}

const initialState: SalidaFormState = {};

export function SalidaForm({ action, initial, backHref, labels, templatePriceCents, templateCurrency }: Props) {
  const [state, formAction, isPending] = useActionState(action, initialState);
  const tz = initial?.timezone ?? 'America/Bogota';

  return (
    <form action={formAction} className="card max-w-2xl flex flex-col gap-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <label className="field">
          <span className="field-label">{labels.starts}</span>
          <input
            name="starts_at"
            type="datetime-local"
            defaultValue={isoToLocalInput(initial?.starts_at, tz)}
            required
            className="field-input"
          />
        </label>
        <label className="field">
          <span className="field-label">{labels.ends}</span>
          <input
            name="ends_at"
            type="datetime-local"
            defaultValue={isoToLocalInput(initial?.ends_at ?? null, tz)}
            className="field-input"
          />
        </label>
      </div>

      <label className="field max-w-xs">
        <span className="field-label">{labels.timezone}</span>
        <select name="timezone" defaultValue={tz} className="field-input">
          {TIMEZONES.map((z) => (
            <option key={z} value={z}>{z}</option>
          ))}
        </select>
      </label>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <label className="field">
          <span className="field-label">{labels.capacity}</span>
          <input
            name="capacity"
            type="number"
            min={1}
            defaultValue={initial?.capacity ?? ''}
            className="field-input"
            placeholder="—"
          />
          <span className="text-xs text-ink-500">{labels.capacityHelp}</span>
        </label>
        <label className="field">
          <span className="field-label">{labels.seatsTaken}</span>
          <input
            name="seats_taken"
            type="number"
            min={0}
            defaultValue={initial?.seats_taken ?? 0}
            className="field-input"
          />
          <span className="text-xs text-ink-500">{labels.seatsHelp}</span>
        </label>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <label className="field">
          <span className="field-label">{labels.priceCents}</span>
          <input
            name="price_cents"
            type="number"
            min={0}
            defaultValue={initial?.price_cents ?? ''}
            className="field-input"
            placeholder={`${templatePriceCents}`}
          />
          <span className="text-xs text-ink-500">{labels.priceHelp}</span>
        </label>
        <label className="field">
          <span className="field-label">{labels.currency}</span>
          <input
            name="currency"
            type="text"
            maxLength={3}
            defaultValue={initial?.currency ?? ''}
            className="field-input"
            placeholder={templateCurrency}
          />
        </label>
      </div>

      <label className="field">
        <span className="field-label">{labels.notes}</span>
        <textarea
          name="notes"
          defaultValue={initial?.notes ?? ''}
          rows={3}
          className="field-input resize-y"
        />
      </label>

      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          name="is_published"
          defaultChecked={initial?.is_published ?? true}
          className="h-4 w-4"
        />
        <span className="text-sm">{labels.published}</span>
      </label>

      {state.error ? <p className="text-sm text-danger">{state.error}</p> : null}

      <div className="flex gap-3 mt-2">
        <button type="submit" disabled={isPending} className="btn-primary">
          {isPending ? labels.saving : labels.submit}
        </button>
        <Link href={backHref} className="btn-secondary">
          {labels.cancel}
        </Link>
      </div>
    </form>
  );
}
