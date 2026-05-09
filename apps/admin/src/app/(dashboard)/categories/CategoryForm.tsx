'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import type { DbCategory } from '@minga/types';
import type { CategoryFormState } from './actions';

const ICON_OPTIONS = [
  'mountain',
  'mountain-snow',
  'bike',
  'footprints',
  'compass',
  'leaf',
  'sparkles',
  'drama',
  'medal',
  'flag',
  'map',
  'map-pin',
  'star',
];

interface Props {
  action: (state: CategoryFormState, formData: FormData) => Promise<CategoryFormState>;
  initial?: Partial<DbCategory>;
  submitLabel: string;
}

const initialState: CategoryFormState = {};

export function CategoryForm({ action, initial, submitLabel }: Props) {
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="card max-w-xl flex flex-col gap-4">
      <label className="field">
        <span className="field-label">Slug</span>
        <input
          name="slug"
          defaultValue={initial?.slug ?? ''}
          required
          className="field-input font-mono"
          placeholder="hiking"
        />
        <span className="text-xs text-ink-500">
          Lowercase, dashes only. Used in URLs and as the stable identifier.
        </span>
      </label>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <label className="field">
          <span className="field-label">Name (English)</span>
          <input name="name_en" defaultValue={initial?.name_en ?? ''} required className="field-input" />
        </label>
        <label className="field">
          <span className="field-label">Nombre (Español)</span>
          <input name="name_es" defaultValue={initial?.name_es ?? ''} required className="field-input" />
        </label>
      </div>

      <label className="field">
        <span className="field-label">Icon</span>
        <select name="icon_name" defaultValue={initial?.icon_name ?? ''} className="field-input">
          <option value="">— none —</option>
          {ICON_OPTIONS.map((i) => (
            <option key={i} value={i}>
              {i}
            </option>
          ))}
        </select>
        <span className="text-xs text-ink-500">
          Must match a name in the mobile app's Icon component.
        </span>
      </label>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <label className="field">
          <span className="field-label">Sort order</span>
          <input
            name="sort_order"
            type="number"
            defaultValue={initial?.sort_order ?? 0}
            className="field-input"
          />
        </label>
        <label className="flex items-center gap-2 mt-7">
          <input
            type="checkbox"
            name="is_active"
            defaultChecked={initial?.is_active ?? true}
            className="h-4 w-4"
          />
          <span className="text-sm">Visible to users</span>
        </label>
      </div>

      {state.error ? <p className="text-sm text-danger">{state.error}</p> : null}

      <div className="flex gap-3 mt-2">
        <button type="submit" disabled={isPending} className="btn-primary">
          {isPending ? 'Saving…' : submitLabel}
        </button>
        <Link href="/categories" className="btn-secondary">
          Cancel
        </Link>
      </div>
    </form>
  );
}
