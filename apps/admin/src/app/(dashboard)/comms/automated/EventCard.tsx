'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, Plus, Star, Trash2 } from 'lucide-react';
import type { CommPlaceholder, DbCommTemplate } from '@minga/types';
import { TemplateEditor } from './TemplateEditor';
import { deleteCommTemplateAction, setActiveCommTemplateAction } from './actions';

interface Labels {
  active: string;
  inactive: string;
  setActive: string;
  delete: string;
  addTemplate: string;
  // forwarded to TemplateEditor
  editor: {
    name: string;
    subject: string;
    body: string;
    active: string;
    save: string;
    saved: string;
    placeholdersHelp: string;
  };
}

interface Props {
  eventKey: string;
  eventDescription: string;
  placeholders: CommPlaceholder[];
  templates: DbCommTemplate[];
  labels: Labels;
}

export function EventCard({ eventKey, eventDescription, placeholders, templates, labels }: Props) {
  const [adding, setAdding] = useState(false);

  // Sort: active first, then by name. Group by `${locale}|${channel}` so the
  // UI can show one active card per combo if present.
  const active = templates.filter((t) => t.is_active);
  const inactive = templates.filter((t) => !t.is_active);

  return (
    <section
      data-testid={`event-card-${eventKey}`}
      className="card flex flex-col gap-3"
    >
      <header className="flex items-baseline justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-wider text-ink-500">Event</div>
          <h2 className="font-bold text-lg">{eventKey}</h2>
        </div>
        <p className="text-sm text-ink-500 max-w-md text-right">{eventDescription}</p>
      </header>

      {active.length === 0 && inactive.length === 0 ? (
        <p className="text-sm text-ink-500 italic">No templates yet for this event.</p>
      ) : null}

      {active.map((tmpl) => (
        <CollapsibleTemplate
          key={tmpl.id}
          tmpl={tmpl}
          placeholders={placeholders}
          labels={labels}
          activeStyling
          startExpanded
        />
      ))}

      {inactive.map((tmpl) => (
        <CollapsibleTemplate
          key={tmpl.id}
          tmpl={tmpl}
          placeholders={placeholders}
          labels={labels}
        />
      ))}

      {adding ? (
        <div className="border border-dashed border-primary/40 rounded-lg p-4 bg-primary/5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs uppercase tracking-wider font-bold text-primary">
              New template
            </span>
            <button
              type="button"
              onClick={() => setAdding(false)}
              className="text-xs text-ink-500 hover:text-ink-900"
            >
              Cancel
            </button>
          </div>
          <TemplateEditor
            eventKey={eventKey}
            initial={null}
            placeholders={placeholders}
            labels={labels.editor}
          />
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="btn-secondary text-xs self-start flex items-center gap-1"
          data-testid={`add-template-${eventKey}`}
        >
          <Plus size={12} /> {labels.addTemplate}
        </button>
      )}
    </section>
  );
}

function CollapsibleTemplate({
  tmpl,
  placeholders,
  labels,
  activeStyling = false,
  startExpanded = false,
}: {
  tmpl: DbCommTemplate;
  placeholders: CommPlaceholder[];
  labels: Labels;
  activeStyling?: boolean;
  startExpanded?: boolean;
}) {
  const [expanded, setExpanded] = useState(startExpanded);
  return (
    <div
      data-testid={`template-${tmpl.id}`}
      data-active={tmpl.is_active}
      className={[
        'rounded-lg border transition-colors',
        activeStyling
          ? 'bg-primary/5 border-primary/40 ring-1 ring-primary/30'
          : 'bg-surface-alt border-surface-border',
      ].join(' ')}
    >
      <div className="flex items-center gap-2 px-3 py-2">
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="flex items-center gap-2 flex-1 text-left"
          aria-expanded={expanded}
        >
          {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          <span className="font-semibold text-sm">{tmpl.name}</span>
          <span className="text-[10px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded bg-surface text-ink-700 border border-surface-border">
            {tmpl.locale.toUpperCase()}
          </span>
          <span className="text-[10px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded bg-surface text-ink-700 border border-surface-border">
            {tmpl.channel}
          </span>
          {tmpl.is_active ? (
            <span className="ml-auto text-[10px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded bg-primary text-white flex items-center gap-1">
              <Star size={10} fill="currentColor" /> {labels.active}
            </span>
          ) : (
            <span className="ml-auto text-[10px] uppercase tracking-wider font-bold text-ink-500">
              {labels.inactive}
            </span>
          )}
        </button>
      </div>

      {expanded ? (
        <div className="border-t border-surface-border px-3 py-3 flex flex-col gap-3 bg-surface">
          {tmpl.subject ? (
            <div className="text-xs text-ink-500">
              <span className="uppercase tracking-wider font-bold mr-2">Subject</span>
              <span className="text-ink-700">{tmpl.subject}</span>
            </div>
          ) : null}
          <pre className="text-xs whitespace-pre-wrap text-ink-700 bg-surface-alt rounded p-2 max-h-40 overflow-auto">
            {tmpl.body}
          </pre>

          <div className="flex items-center gap-2 flex-wrap">
            {!tmpl.is_active ? (
              <form action={setActiveCommTemplateAction}>
                <input type="hidden" name="id" value={tmpl.id} />
                <button type="submit" className="btn-primary text-xs flex items-center gap-1">
                  <Star size={12} /> {labels.setActive}
                </button>
              </form>
            ) : null}
            <form
              action={deleteCommTemplateAction}
              onSubmit={(e) => {
                if (!confirm(`Delete "${tmpl.name}"?`)) e.preventDefault();
              }}
            >
              <input type="hidden" name="id" value={tmpl.id} />
              <button type="submit" className="btn-secondary text-xs text-danger flex items-center gap-1">
                <Trash2 size={12} /> {labels.delete}
              </button>
            </form>
          </div>

          <details className="text-xs">
            <summary className="cursor-pointer text-ink-500">Edit template</summary>
            <div className="mt-3">
              <TemplateEditor
                eventKey={tmpl.event_key}
                initial={tmpl}
                placeholders={placeholders}
                labels={labels.editor}
              />
            </div>
          </details>
        </div>
      ) : null}
    </div>
  );
}
