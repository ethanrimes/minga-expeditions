import type { ActivityShareAdapter } from '@minga/ui';

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
};
