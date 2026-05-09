'use client';

import Link from 'next/link';
import { useActionState, useState } from 'react';
import type { DbCategory, DbExpedition } from '@minga/types';
import type { ExpeditionFormState } from './actions';

interface Props {
  action: (state: ExpeditionFormState, formData: FormData) => Promise<ExpeditionFormState>;
  categories: DbCategory[];
  initial?: Partial<DbExpedition>;
  submitLabel: string;
}

const initialState: ExpeditionFormState = {};

export function ExpeditionForm({ action, categories, initial, submitLabel }: Props) {
  const [state, formAction, isPending] = useActionState(action, initialState);
  const [previewUrl, setPreviewUrl] = useState<string | null>(initial?.cover_photo_url ?? null);

  return (
    <form action={formAction} encType="multipart/form-data" className="card max-w-3xl flex flex-col gap-5">
      <label className="field">
        <span className="field-label">Title</span>
        <input name="title" defaultValue={initial?.title ?? ''} required className="field-input" />
      </label>

      <label className="field">
        <span className="field-label">Description</span>
        <textarea
          name="description"
          defaultValue={initial?.description ?? ''}
          required
          rows={5}
          className="field-input resize-y"
        />
      </label>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <label className="field">
          <span className="field-label">Category</span>
          <select
            name="category_id"
            defaultValue={initial?.category_id ?? ''}
            required
            className="field-input"
          >
            <option value="" disabled>
              Select a category
            </option>
            {categories
              .filter((c) => c.is_active || c.id === initial?.category_id)
              .map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name_en}
                </option>
              ))}
          </select>
        </label>

        <label className="field">
          <span className="field-label">Difficulty (1–5)</span>
          <input
            name="difficulty"
            type="number"
            min={1}
            max={5}
            defaultValue={initial?.difficulty ?? 3}
            className="field-input"
          />
        </label>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <label className="field sm:col-span-2">
          <span className="field-label">Location</span>
          <input
            name="location_name"
            defaultValue={initial?.location_name ?? ''}
            required
            className="field-input"
            placeholder="Valle de Cocora"
          />
        </label>
        <label className="field">
          <span className="field-label">Region</span>
          <input name="region" defaultValue={initial?.region ?? ''} className="field-input" />
        </label>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <label className="field">
          <span className="field-label">Country</span>
          <input
            name="country"
            defaultValue={initial?.country ?? 'Colombia'}
            className="field-input"
          />
        </label>
        <label className="field">
          <span className="field-label">Start latitude</span>
          <input
            name="start_lat"
            type="number"
            step="0.000001"
            defaultValue={initial?.start_lat ?? ''}
            className="field-input"
          />
        </label>
        <label className="field">
          <span className="field-label">Start longitude</span>
          <input
            name="start_lng"
            type="number"
            step="0.000001"
            defaultValue={initial?.start_lng ?? ''}
            className="field-input"
          />
        </label>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <label className="field">
          <span className="field-label">Distance (km)</span>
          <input
            name="distance_km"
            type="number"
            step="0.1"
            defaultValue={initial?.distance_km ?? ''}
            className="field-input"
          />
        </label>
        <label className="field">
          <span className="field-label">Elevation gain (m)</span>
          <input
            name="elevation_gain_m"
            type="number"
            step="1"
            defaultValue={initial?.elevation_gain_m ?? ''}
            className="field-input"
          />
        </label>
        <label className="field">
          <span className="field-label">Currency</span>
          <input
            name="currency"
            defaultValue={initial?.currency ?? 'COP'}
            className="field-input"
            maxLength={3}
          />
        </label>
      </div>

      <label className="field">
        <span className="field-label">Price (in cents — 0 = free)</span>
        <input
          name="price_cents"
          type="number"
          min={0}
          defaultValue={initial?.price_cents ?? 0}
          className="field-input"
        />
        <span className="text-xs text-ink-500">
          Wompi expects integer cents in the order's currency. 50000 COP = 5,000,000 here.
        </span>
      </label>

      <fieldset className="field">
        <span className="field-label">Cover photo</span>
        <div className="flex items-start gap-4">
          {previewUrl ? (
            // Plain <img> so we don't have to whitelist arbitrary user-uploaded
            // hosts in next.config — and the preview is throwaway pre-submit.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewUrl}
              alt="Cover preview"
              className="h-24 w-32 rounded-md object-cover border border-surface-border"
            />
          ) : null}
          <div className="flex-1">
            <input
              name="cover_photo"
              type="file"
              accept="image/*"
              className="text-sm"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) setPreviewUrl(URL.createObjectURL(file));
              }}
            />
            <input type="hidden" name="cover_photo_url" value={initial?.cover_photo_url ?? ''} />
            <p className="text-xs text-ink-500 mt-2">
              Uploads to the <code>expedition-photos</code> Supabase bucket. Leave empty to keep the existing photo.
            </p>
          </div>
        </div>
      </fieldset>

      <div className="flex flex-wrap gap-6">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            name="is_official"
            defaultChecked={initial?.is_official ?? true}
            className="h-4 w-4"
          />
          <span className="text-sm">Official Minga listing</span>
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            name="is_published"
            defaultChecked={initial?.is_published ?? true}
            className="h-4 w-4"
          />
          <span className="text-sm">Published (visible in mobile feed)</span>
        </label>
      </div>

      {state.error ? <p className="text-sm text-danger">{state.error}</p> : null}

      <div className="flex gap-3 mt-2">
        <button type="submit" disabled={isPending} className="btn-primary">
          {isPending ? 'Saving…' : submitLabel}
        </button>
        <Link href="/expeditions" className="btn-secondary">
          Cancel
        </Link>
      </div>

    </form>
  );
}
