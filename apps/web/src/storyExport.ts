// Mirror of apps/mobile-web/src/storyExport.ts. Loads the SVG share-card
// from the Edge Function and rasterizes it to a 1080x1920 PNG on the
// client so the social share sheet receives a story-ready PNG.

const STORY_WIDTH = 1080;
const STORY_HEIGHT = 1920;

export async function svgUrlToPngBlob(svgUrl: string): Promise<Blob | null> {
  try {
    const res = await fetch(svgUrl, { credentials: 'omit' });
    if (!res.ok) throw new Error(`share card fetch failed: ${res.status}`);
    const svgText = await res.text();
    return await svgTextToPngBlob(svgText);
  } catch (e) {
    console.warn('svgUrlToPngBlob failed', e);
    return null;
  }
}

export async function svgTextToPngBlob(svgText: string): Promise<Blob | null> {
  const blob = new Blob([svgText], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  try {
    const img = await loadImage(url);
    const canvas = document.createElement('canvas');
    canvas.width = STORY_WIDTH;
    canvas.height = STORY_HEIGHT;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.fillStyle = '#0E1116';
    ctx.fillRect(0, 0, STORY_WIDTH, STORY_HEIGHT);
    ctx.drawImage(img, 0, 0, STORY_WIDTH, STORY_HEIGHT);
    return await new Promise<Blob | null>((resolve) => canvas.toBlob((b) => resolve(b), 'image/png'));
  } finally {
    URL.revokeObjectURL(url);
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
    img.src = src;
  });
}

export async function shareStory(opts: {
  activityId: string;
  title: string;
  caption: string;
  svgUrl: string;
}): Promise<'shared' | 'downloaded' | 'unavailable'> {
  const png = await svgUrlToPngBlob(opts.svgUrl);
  if (!png) return 'unavailable';
  const file = new File([png], `minga-${opts.activityId}.png`, { type: 'image/png' });
  const nav = navigator as Navigator & {
    share?: (data: { files?: File[]; title?: string; text?: string }) => Promise<void>;
    canShare?: (data: { files?: File[] }) => boolean;
  };
  if (typeof nav.share === 'function' && nav.canShare?.({ files: [file] })) {
    try {
      await nav.share({ files: [file], title: opts.title, text: opts.caption });
      return 'shared';
    } catch (e) {
      console.warn('navigator.share(files) failed, downloading instead', e);
    }
  }
  const url = URL.createObjectURL(png);
  const a = document.createElement('a');
  a.href = url;
  a.download = `minga-${opts.activityId}.png`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return 'downloaded';
}
