import type { DbExpeditionPhoto } from '@minga/types';
import {
  addExpeditionPhotosAction,
  deleteExpeditionPhotoAction,
  moveExpeditionPhotoAction,
} from './photos-actions';

interface Labels {
  heading: string;
  subtitle: string;
  upload: string;
  uploadHelp: string;
  empty: string;
  moveUp: string;
  moveDown: string;
  delete: string;
  coverBadge: string;
}

interface Props {
  expeditionId: string;
  photos: DbExpeditionPhoto[];
  labels: Labels;
}

// Renders the photo gallery management strip on the expedition edit page.
// Server-component: each row uses small <form> elements to call server
// actions for delete + reorder. The multi-upload sits at the bottom.
export function PhotoGallery({ expeditionId, photos, labels }: Props) {
  return (
    <section className="card mt-8">
      <header className="mb-4">
        <h2 className="text-lg font-semibold">{labels.heading}</h2>
        <p className="text-ink-500 text-sm">{labels.subtitle}</p>
      </header>

      {photos.length === 0 ? (
        <p className="text-ink-500 text-sm py-4">{labels.empty}</p>
      ) : (
        <ul data-testid="expedition-photo-list" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {photos.map((p, i) => (
            <li
              key={p.id}
              data-testid={`expedition-photo-${p.id}`}
              data-order-index={p.order_index}
              className="flex flex-col rounded-lg border border-surface-border bg-surface-alt overflow-hidden"
            >
              <div className="relative aspect-[4/3] bg-surface-border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.url} alt={p.caption ?? ''} className="absolute inset-0 w-full h-full object-cover" />
                {i === 0 ? (
                  <span className="absolute top-2 left-2 rounded-full bg-primary text-primary-fg px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide">
                    {labels.coverBadge}
                  </span>
                ) : null}
              </div>
              <div className="flex items-center justify-between gap-2 p-2">
                <div className="text-xs text-ink-500 truncate flex-1">{p.caption ?? `#${i + 1}`}</div>
                <div className="flex gap-1">
                  <form action={moveExpeditionPhotoAction}>
                    <input type="hidden" name="photo_id" value={p.id} />
                    <input type="hidden" name="expedition_id" value={expeditionId} />
                    <input type="hidden" name="direction" value="up" />
                    <button
                      type="submit"
                      disabled={i === 0}
                      className="px-2 py-1 text-xs rounded border border-surface-border bg-surface disabled:opacity-40"
                      aria-label={labels.moveUp}
                    >
                      ↑
                    </button>
                  </form>
                  <form action={moveExpeditionPhotoAction}>
                    <input type="hidden" name="photo_id" value={p.id} />
                    <input type="hidden" name="expedition_id" value={expeditionId} />
                    <input type="hidden" name="direction" value="down" />
                    <button
                      type="submit"
                      disabled={i === photos.length - 1}
                      className="px-2 py-1 text-xs rounded border border-surface-border bg-surface disabled:opacity-40"
                      aria-label={labels.moveDown}
                    >
                      ↓
                    </button>
                  </form>
                  <form action={deleteExpeditionPhotoAction}>
                    <input type="hidden" name="photo_id" value={p.id} />
                    <input type="hidden" name="expedition_id" value={expeditionId} />
                    <button
                      type="submit"
                      className="px-2 py-1 text-xs rounded border border-danger/40 text-danger bg-danger/5"
                      aria-label={labels.delete}
                    >
                      ×
                    </button>
                  </form>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <form
        action={addExpeditionPhotosAction}
        encType="multipart/form-data"
        className="mt-6 flex flex-wrap items-center gap-3"
      >
        <input type="hidden" name="expedition_id" value={expeditionId} />
        <input
          type="file"
          name="photos"
          accept="image/*"
          multiple
          className="text-sm"
          data-testid="photo-upload-input"
        />
        <button type="submit" className="btn-primary text-xs">
          {labels.upload}
        </button>
        <p className="text-xs text-ink-500">{labels.uploadHelp}</p>
      </form>
    </section>
  );
}
