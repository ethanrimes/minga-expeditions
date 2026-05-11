'use client';

import { useActionState } from 'react';
import type { CommChannel, CommLocale, DbCommTemplate } from '@minga/types';
import { saveCommTemplateAction, type CommTemplateFormState } from './actions';

interface Labels {
  subject: string;
  body: string;
  active: string;
  save: string;
  saved: string;
  empty: string;
  placeholdersHelp: string;
  channelLabel: string;
}

interface Props {
  eventKey: string;
  locale: CommLocale;
  channel: CommChannel;
  initial: DbCommTemplate | null;
  labels: Labels;
}

const initialState: CommTemplateFormState = {};

export function TemplateEditor({ eventKey, locale, channel, initial, labels }: Props) {
  const [state, formAction, pending] = useActionState(saveCommTemplateAction, initialState);

  return (
    <form
      action={formAction}
      data-testid={`tmpl-${eventKey}-${locale}-${channel}`}
      className="flex flex-col gap-2 p-4 rounded-lg border border-surface-border bg-surface-alt"
    >
      <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-ink-500">
        <span className="font-bold">{locale.toUpperCase()}</span>
        <span>·</span>
        <span>{labels.channelLabel}</span>
        {!initial ? <span className="ml-auto text-ink-300">{labels.empty}</span> : null}
      </div>

      <input type="hidden" name="event_key" value={eventKey} />
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="channel" value={channel} />

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
      </label>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="is_active"
          defaultChecked={initial?.is_active ?? true}
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
