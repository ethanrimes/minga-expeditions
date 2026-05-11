import type { ActivityShareAdapter } from '@minga/ui';
import { svgUrlToPngBlob } from './storyExport';

// Web equivalent of apps/mobile/src/shareAdapter.ts. Uses navigator.share
// when available (mobile browsers, Safari, recent Chrome on macOS) and
// falls back to copying the deep link to the clipboard so the user has
// something usable to paste.
export const shareAdapter: ActivityShareAdapter = {
  async share({ title, deepLink, caption }) {
    const nav = navigator as Navigator & {
      share?: (data: { title?: string; text?: string; url?: string }) => Promise<void>;
    };
    if (typeof nav.share === 'function') {
      try {
        await nav.share({ title, text: caption, url: deepLink });
        return;
      } catch (e) {
        // User dismissed, or share failed — fall through to clipboard.
        console.warn('navigator.share failed, falling back to clipboard', e);
      }
    }
    try {
      await navigator.clipboard.writeText(deepLink);
    } catch (e) {
      console.warn('clipboard write failed', e);
    }
  },

  async shareToStory({ activityId, title, cardUrl, caption }) {
    const png = await svgUrlToPngBlob(cardUrl);
    if (!png) {
      console.warn('story rasterization failed; falling back to plain share');
      await this.share({ activityId, title, cardUrl, deepLink: cardUrl, caption });
      return { kind: 'unavailable' };
    }
    const file = new File([png], `minga-${activityId}.png`, { type: 'image/png' });
    const nav = navigator as Navigator & {
      share?: (data: { files?: File[]; title?: string; text?: string }) => Promise<void>;
      canShare?: (data: { files?: File[] }) => boolean;
    };
    if (typeof nav.share === 'function' && nav.canShare?.({ files: [file] })) {
      try {
        await nav.share({ files: [file], title, text: caption });
        return { kind: 'shared' };
      } catch (e) {
        console.warn('navigator.share(files) failed, downloading instead', e);
      }
    }
    downloadBlob(png, `minga-${activityId}.png`);
    return { kind: 'downloaded' };
  },
};

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
