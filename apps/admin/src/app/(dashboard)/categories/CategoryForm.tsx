'use client';

import Link from 'next/link';
import { useActionState, useState } from 'react';
import type { DbCategory } from '@minga/types';
import { CategoryIcon } from '@/components/CategoryIcon';
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

interface Labels {
  slug: string;
  slugHelp: string;
  nameEn: string;
  nameEs: string;
  icon: string;
  iconNone: string;
  iconHelp: string;
  sortOrder: string;
  visible: string;
  saving: string;
  cancel: string;
  submit: string;
}

interface Props {
  action: (state: CategoryFormState, formData: FormData) => Promise<CategoryFormState>;
  initial?: Partial<DbCategory>;
  labels: Labels;
}

const initialState: CategoryFormState = {};

export function CategoryForm({ action, initial, labels }: Props) {
  const [state, formAction, isPending] = useActionState(action, initialState);
  const [iconName, setIconName] = useState<string>(initial?.icon_name ?? '');

  return (
    <form action={formAction} className="card max-w-xl flex flex-col gap-4">
      <label className="field">
        <span className="field-label">{labels.slug}</span>
        <input
          name="slug"
          defaultValue={initial?.slug ?? ''}
          required
          className="field-input font-mono"
          placeholder="hiking"
        />
        <span className="text-xs text-ink-500">{labels.slugHelp}</span>
      </label>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <label className="field">
          <span className="field-label">{labels.nameEn}</span>
          <input name="name_en" defaultValue={initial?.name_en ?? ''} required className="field-input" />
        </label>
        <label className="field">
          <span className="field-label">{labels.nameEs}</span>
          <input name="name_es" defaultValue={initial?.name_es ?? ''} required className="field-input" />
        </label>
      </div>

      <label className="field">
        <span className="field-label">{labels.icon}</span>
        <div className="flex items-center gap-3">
          <select
            name="icon_name"
            value={iconName}
            onChange={(e) => setIconName(e.target.value)}
            className="field-input flex-1"
          >
            <option value="">{labels.iconNone}</option>
            {ICON_OPTIONS.map((i) => (
              <option key={i} value={i}>
                {i}
              </option>
            ))}
          </select>
          <span className="shrink-0 h-10 w-10 rounded-md border border-surface-border bg-surface-alt flex items-center justify-center text-ink-700">
            {iconName ? <CategoryIcon name={iconName} size={20} /> : <span className="text-ink-300">—</span>}
          </span>
        </div>
        <span className="text-xs text-ink-500">{labels.iconHelp}</span>
      </label>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <label className="field">
          <span className="field-label">{labels.sortOrder}</span>
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
          <span className="text-sm">{labels.visible}</span>
        </label>
      </div>

      {state.error ? <p className="text-sm text-danger">{state.error}</p> : null}

      <div className="flex gap-3 mt-2">
        <button type="submit" disabled={isPending} className="btn-primary">
          {isPending ? labels.saving : labels.submit}
        </button>
        <Link href="/categories" className="btn-secondary">
          {labels.cancel}
        </Link>
      </div>
    </form>
  );
}
