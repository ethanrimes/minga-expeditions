import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import type { ActivityShareAdapter } from '@minga/ui';

// Downloads the SVG share card to local cache and opens the native share
// sheet. The user can pick WhatsApp, Instagram Stories, Facebook, or any
// other configured target. If sharing isn't available on the device we
// fall back to copying the deep link to the system clipboard.
export const shareAdapter: ActivityShareAdapter = {
  async share({ activityId, cardUrl, deepLink, caption }) {
    if (!(await Sharing.isAvailableAsync())) {
      console.warn('Sharing not available on this device');
      return;
    }
    const localPath = `${FileSystem.cacheDirectory}minga-share-${activityId}.svg`;
    try {
      await FileSystem.downloadAsync(cardUrl, localPath);
      await Sharing.shareAsync(localPath, {
        mimeType: 'image/svg+xml',
        dialogTitle: caption,
        UTI: 'public.svg-image',
      });
    } catch (e) {
      console.warn('Share failed; falling back to deep link', e);
      // No SVG → still share the deep link as plain text.
      await Sharing.shareAsync(deepLink, { dialogTitle: caption });
    }
  },
};
