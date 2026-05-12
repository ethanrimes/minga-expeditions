'use client';

import { useActionState, useState } from 'react';
import type { CommChannel, CommLocale, CommPlaceholder, DbCommTemplate } from '@minga/types';
import { saveCommTemplateAction, type CommTemplateFormState } from './actions';

interface Labels {
  name: string;
  subject: string;
  body: string;
  active: string;
  save: string;
  saved: string;
  placeholdersHelp: string;
}

interface Props {
  eventKey: string;
  initial: DbCommTemplate | null;
  defaultLocale?: CommLocale;
  defaultChannel?: CommChannel;
  placeholders: CommPlaceholder[];
  labels: Labels;
}

const initialState: CommTemplateFormState = {};

export function TemplateEditor({
  eventKey,
  initial,
  defaultLocale = 'es',
  defaultChannel = 'email',
  placeholders,
  labels,
}: Props) {
  const [state, formAction, pending] = useActionState(saveCommTemplateAction, initialState);
  const [locale, setLocale] = useState<CommLocale>(initial?.locale ?? defaultLocale);
  const [channel, setChannel] = useState<CommChannel>(initial?.channel ?? defaultChannel);

  return (
    <form
      action={formAction}
      data-testid={`tmpl-form-${initial?.id ?? 'new'}`}
      className="flex flex-col gap-3"
    >
      <input type="hidden" name="event_key" value={eventKey} />
      {initial ? <input type="hidden" name="id" value={initial.id} /> : null}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <label className="field">
          <span className="field-label">{labels.name}</span>
          <input
            name="name"
            defaultValue={initial?.name ?? 'Default'}
            required
            className="field-input"
          />
        </label>
        <label className="field">
          <span className="field-label">Language</span>
          <select
            name="locale"
            value={locale}
            onChange={(e) => setLocale(e.target.value as CommLocale)}
            className="field-input"
          >
            <option value="es">ES</option>
            <option value="en">EN</option>
          </select>
        </label>
        <label className="field">
          <span className="field-label">Channel</span>
          <select
            name="channel"
            value={channel}
            onChange={(e) => setChannel(e.target.value as CommChannel)}
            className="field-input"
          >
            <option value="email">Email</option>
            <option value="whatsapp">WhatsApp</option>
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
          rows={5}
          required
          className="field-input resize-y"
        />
        <span className="text-xs text-ink-500 mt-1">{labels.placeholdersHelp}</span>
        {placeholders.length > 0 ? (
          <span className="text-[11px] text-ink-500 mt-1 flex flex-wrap gap-1">
            {placeholders.map((p) => (
              <code
                key={p.key}
                title={p.label}
                className="px-1.5 py-0.5 rounded bg-surface-alt border border-surface-border"
              >
                {'{' + p.key + '}'}
              </code>
            ))}
          </span>
        ) : null}
      </label>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="is_active"
          defaultChecked={initial?.is_active ?? false}
          className="h-4 w-4"
        />
        <span>{labels.active}</span>
      </label>

      {state.error ? <p className="text-xs text-danger">{state.error}</p> : null}
      {state.saved ? <p className="text-xs text-success">{labels.saved}</p> : null}

      <button type="submit" disabled={pending} className="btn-primary text-xs self-start">
        {pending ? '…' : labels.save}
      </button>
    </form>
  );
}
