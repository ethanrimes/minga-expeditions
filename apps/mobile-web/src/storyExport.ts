// Loads an SVG share-card URL and rasterizes it to a PNG Blob entirely on
// the client. Used by the "Share to story" button so the social share sheet
// receives a PNG (Instagram / Facebook / WhatsApp Stories all accept PNG;
// none reliably accept SVG).
//
// The activity-share-card Edge Function renders at 1080×1920 — match those
// dimensions here so the asset is story-ready without further scaling.

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
  // Wrap SVG in a data URL so the browser image loader will pick up styles +
  // gradients inside the SVG itself. Without this, Safari sometimes refuses
  // to load remote SVGs into a same-origin canvas.
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
