'use client';

import { useActionState } from 'react';
import type { DbProvider, VendorType } from '@minga/types';
import {
  createProviderAction,
  updateProviderAction,
  type ProviderFormState,
} from './actions';

const VENDOR_TYPES: VendorType[] = [
  'full_experience',
  'transportation',
  'lodging',
  'guide',
  'food',
  'other',
];

const initialState: ProviderFormState = {};

interface Labels {
  name: string;
  vendorType: string;
  none: string;
  region: string;
  regionPlaceholder: string;
  website: string;
  email: string;
  phone: string;
  whatsapp: string;
  notes: string;
  activeHelp: string;
  saved: string;
  saveChanges: string;
  createProvider: string;
  vendorTypes: Record<VendorType, string>;
}

export function ProviderForm({ initial, labels }: { initial: DbProvider | null; labels: Labels }) {
  const action = initial
    ? updateProviderAction.bind(null, initial.id)
    : createProviderAction;
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="card flex flex-col gap-4 max-w-2xl">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label className="field">
          <span className="field-label">{labels.name} *</span>
          <input
            name="display_name"
            defaultValue={initial?.display_name ?? ''}
            required
            className="field-input"
            data-testid="provider-name"
          />
        </label>
        <label className="field">
          <span className="field-label">{labels.vendorType}</span>
          <select
            name="vendor_type"
            defaultValue={initial?.vendor_type ?? ''}
            className="field-input"
          >
            <option value="">{labels.none}</option>
            {VENDOR_TYPES.map((vt) => (
              <option key={vt} value={vt}>
                {labels.vendorTypes[vt]}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label className="field">
          <span className="field-label">{labels.region}</span>
          <input
            name="region"
            defaultValue={initial?.region ?? ''}
            className="field-input"
            placeholder={labels.regionPlaceholder}
          />
        </label>
        <label className="field">
          <span className="field-label">{labels.website}</span>
          <input
            name="website"
            defaultValue={initial?.website ?? ''}
            type="url"
            className="field-input"
            placeholder="https://"
          />
        </label>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <label className="field">
          <span className="field-label">{labels.email}</span>
          <input
            name="contact_email"
            defaultValue={initial?.contact_email ?? ''}
            type="email"
            className="field-input"
          />
        </label>
        <label className="field">
          <span className="field-label">{labels.phone}</span>
          <input
            name="contact_phone"
            defaultValue={initial?.contact_phone ?? ''}
            type="tel"
            className="field-input"
          />
        </label>
        <label className="field">
          <span className="field-label">{labels.whatsapp}</span>
          <input
            name="whatsapp"
            defaultValue={initial?.whatsapp ?? ''}
            type="tel"
            className="field-input"
          />
        </label>
      </div>

      <label className="field">
        <span className="field-label">{labels.notes}</span>
        <textarea
          name="notes"
          defaultValue={initial?.notes ?? ''}
          rows={4}
          className="field-input resize-y"
        />
      </label>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="is_active"
          defaultChecked={initial?.is_active ?? true}
          className="h-4 w-4"
        />
        <span>{labels.activeHelp}</span>
      </label>

      {state.error ? <p className="text-xs text-danger">{state.error}</p> : null}
      {state.saved ? <p className="text-xs text-success">{labels.saved}</p> : null}

      <button type="submit" disabled={pending} className="btn-primary text-sm self-start">
        {pending ? '…' : initial ? labels.saveChanges : labels.createProvider}
      </button>
    </form>
  );
}
