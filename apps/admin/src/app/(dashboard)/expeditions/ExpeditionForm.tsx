'use client';

import Link from 'next/link';
import { useActionState, useState } from 'react';
import type { DbCategory, DbExpedition } from '@minga/types';
import { LocationPicker } from '@/components/LocationPicker';
import type { ExpeditionFormState } from './actions';

interface Labels {
  title: string;
  description: string;
  category: string;
  selectCategory: string;
  difficulty: string;
  location: string;
  region: string;
  country: string;
  startLat: string;
  startLng: string;
  locationSearch: string;
  locationSearchPlaceholder: string;
  locationSearching: string;
  locationNoResults: string;
  locationHelp: string;
  distance: string;
  elevation: string;
  currency: string;
  priceCents: string;
  priceHelp: string;
  coverPhoto: string;
  coverPreviewAlt: string;
  coverHelp: string;
  official: string;
  published: string;
  saving: string;
  cancel: string;
  submit: string;
}

interface Props {
  action: (state: ExpeditionFormState, formData: FormData) => Promise<ExpeditionFormState>;
  categories: DbCategory[];
  initial?: Partial<DbExpedition>;
  labels: Labels;
  locale: 'en' | 'es';
}

const initialState: ExpeditionFormState = {};

export function ExpeditionForm({ action, categories, initial, labels, locale }: Props) {
  const [state, formAction, isPending] = useActionState(action, initialState);
  const [previewUrl, setPreviewUrl] = useState<string | null>(initial?.cover_photo_url ?? null);
  const categoryLabel = (c: DbCategory) => (locale === 'es' ? c.name_es : c.name_en);

  return (
    <form action={formAction} encType="multipart/form-data" className="card max-w-3xl flex flex-col gap-5">
      <label className="field">
        <span className="field-label">{labels.title}</span>
        <input name="title" defaultValue={initial?.title ?? ''} required className="field-input" />
      </label>

      <label className="field">
        <span className="field-label">{labels.description}</span>
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
          <span className="field-label">{labels.category}</span>
          <select
            name="category_id"
            defaultValue={initial?.category_id ?? ''}
            required
            className="field-input"
          >
            <option value="" disabled>
              {labels.selectCategory}
            </option>
            {categories
              .filter((c) => c.is_active || c.id === initial?.category_id)
              .map((c) => (
                <option key={c.id} value={c.id}>
                  {categoryLabel(c)}
                </option>
              ))}
          </select>
        </label>

        <label className="field">
          <span className="field-label">{labels.difficulty}</span>
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
          <span className="field-label">{labels.location}</span>
          <input
            name="location_name"
            defaultValue={initial?.location_name ?? ''}
            required
            className="field-input"
            placeholder="Valle de Cocora"
          />
        </label>
        <label className="field">
          <span className="field-label">{labels.region}</span>
          <input name="region" defaultValue={initial?.region ?? ''} className="field-input" />
        </label>
      </div>

      <label className="field max-w-xs">
        <span className="field-label">{labels.country}</span>
        <input
          name="country"
          defaultValue={initial?.country ?? 'Colombia'}
          className="field-input"
        />
      </label>

      <LocationPicker
        initialLat={initial?.start_lat ?? null}
        initialLng={initial?.start_lng ?? null}
        locale={locale}
        labels={{
          search: labels.locationSearch,
          searchPlaceholder: labels.locationSearchPlaceholder,
          searching: labels.locationSearching,
          noResults: labels.locationNoResults,
          latitude: labels.startLat,
          longitude: labels.startLng,
          help: labels.locationHelp,
        }}
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <label className="field">
          <span className="field-label">{labels.distance}</span>
          <input
            name="distance_km"
            type="number"
            step="0.1"
            defaultValue={initial?.distance_km ?? ''}
            className="field-input"
          />
        </label>
        <label className="field">
          <span className="field-label">{labels.elevation}</span>
          <input
            name="elevation_gain_m"
            type="number"
            step="1"
            defaultValue={initial?.elevation_gain_m ?? ''}
            className="field-input"
          />
        </label>
        <label className="field">
          <span className="field-label">{labels.currency}</span>
          <input
            name="currency"
            defaultValue={initial?.currency ?? 'COP'}
            className="field-input"
            maxLength={3}
          />
        </label>
      </div>

      <label className="field">
        <span className="field-label">{labels.priceCents}</span>
        <input
          name="price_cents"
          type="number"
          min={0}
          defaultValue={initial?.price_cents ?? 0}
          className="field-input"
        />
        <span className="text-xs text-ink-500">{labels.priceHelp}</span>
      </label>

      <fieldset className="field">
        <span className="field-label">{labels.coverPhoto}</span>
        <div className="flex items-start gap-4">
          {previewUrl ? (
            // Plain <img> so we don't have to whitelist arbitrary user-uploaded
            // hosts in next.config — and the preview is throwaway pre-submit.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewUrl}
              alt={labels.coverPreviewAlt}
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
            <p className="text-xs text-ink-500 mt-2">{labels.coverHelp}</p>
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
          <span className="text-sm">{labels.official}</span>
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
      </div>

      {state.error ? <p className="text-sm text-danger">{state.error}</p> : null}

      <div className="flex gap-3 mt-2">
        <button type="submit" disabled={isPending} className="btn-primary">
          {isPending ? labels.saving : labels.submit}
        </button>
        <Link href="/expeditions" className="btn-secondary">
          {labels.cancel}
        </Link>
      </div>

    </form>
  );
}
