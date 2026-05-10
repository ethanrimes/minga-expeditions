import type { ActivityPhotoPicker } from '@minga/ui';

// Web equivalent of apps/mobile/src/photoPicker.ts. Mounts a hidden
// <input type="file"> on demand, resolves with a Blob when the user picks
// an image, and resolves null on cancel. EXIF parsing is skipped on web —
// the activity screen lets the user enter location/time manually.
export const photoPicker: ActivityPhotoPicker = {
  pickPhoto() {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.style.position = 'fixed';
      input.style.left = '-9999px';
      let settled = false;
      const cleanup = () => {
        window.removeEventListener('focus', onFocus);
        if (input.parentNode) input.parentNode.removeChild(input);
      };
      const onFocus = () => {
        // Browsers don't fire a "cancel" event consistently. Wait one tick
        // after the picker closes; if no file came in, treat as cancel.
        setTimeout(() => {
          if (settled) return;
          settled = true;
          cleanup();
          resolve(null);
        }, 300);
      };
      input.onchange = () => {
        if (settled) return;
        settled = true;
        const file = input.files?.[0];
        cleanup();
        if (!file) return resolve(null);
        resolve({
          blob: file,
          filename: file.name || `photo-${Date.now()}.jpg`,
          lat: null,
          lng: null,
          takenAt: null,
        });
      };
      window.addEventListener('focus', onFocus, { once: true });
      document.body.appendChild(input);
      input.click();
    });
  },
};
