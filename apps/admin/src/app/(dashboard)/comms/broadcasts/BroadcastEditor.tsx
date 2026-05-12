'use client';

import { useActionState, useState } from 'react';
import type {
  CommBroadcastCategory,
  CommChannel,
  CommLocale,
  DbCommBroadcastTemplate,
} from '@minga/types';
import {
  createBroadcastTemplateAction,
  updateBroadcastTemplateAction,
  type BroadcastFormState,
} from './actions';

interface Labels {
  name: string;
  category: string;
  channel: string;
  locale: string;
  subject: string;
  body: string;
  save: string;
  saved: string;
  placeholdersHelp: string;
  channels: { email: string; whatsapp: string };
  categories: Record<CommBroadcastCategory, string>;
}

interface Props {
  initial: DbCommBroadcastTemplate | null;
  labels: Labels;
}

const initialState: BroadcastFormState = {};
const CATEGORIES: CommBroadcastCategory[] = [
  'announcement',
  'promotion',
  'new_trip',
  'reminder',
  'other',
];

export function BroadcastEditor({ initial, labels }: Props) {
  const action = initial
    ? updateBroadcastTemplateAction.bind(null, initial.id)
    : createBroadcastTemplateAction;
  const [state, formAction, pending] = useActionState(action, initialState);
  const [channel, setChannel] = useState<CommChannel>(initial?.channel ?? 'email');

  return (
    <form action={formAction} className="card flex flex-col gap-4 max-w-2xl">
      <label className="field">
        <span className="field-label">{labels.name}</span>
        <input
          name="name"
          defaultValue={initial?.name ?? ''}
          required
          className="field-input"
          data-testid="broadcast-name"
        />
      </label>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <label className="field">
          <span className="field-label">{labels.category}</span>
          <select
            name="category"
            defaultValue={initial?.category ?? 'announcement'}
            className="field-input"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {labels.categories[c]}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span className="field-label">{labels.channel}</span>
          <select
            name="channel"
            value={channel}
            onChange={(e) => setChannel(e.target.value as CommChannel)}
            className="field-input"
          >
            <option value="email">{labels.channels.email}</option>
            <option value="whatsapp">{labels.channels.whatsapp}</option>
          </select>
        </label>

        <label className="field">
          <span className="field-label">{labels.locale}</span>
          <select
            name="locale"
            defaultValue={initial?.locale ?? 'es'}
            className="field-input"
          >
            <option value="es">ES</option>
            <option value="en">EN</option>
          </select>
        </label>
      </div>

      {channel === 'email' ? (
        <label className="field">
          <span className="field-label">{labels.subject}</span>
          <input
            name="subject"
            defaultValue={initial?.subject ?? ''}
            className="field-input"
          />
        </label>
      ) : null}

      <label className="field">
        <span className="field-label">{labels.body}</span>
        <textarea
          name="body"
          defaultValue={initial?.body ?? ''}
          rows={8}
          required
          className="field-input resize-y"
          data-testid="broadcast-body"
        />
        <span className="text-xs text-ink-500 mt-1">{labels.placeholdersHelp}</span>
      </label>

      {state.error ? <p className="text-xs text-danger">{state.error}</p> : null}
      {state.saved ? <p className="text-xs text-success">{labels.saved}</p> : null}

      <button type="submit" disabled={pending} className="btn-primary text-sm self-start">
        {pending ? '…' : labels.save}
      </button>
    </form>
  );
}

export type { CommLocale, CommChannel };
