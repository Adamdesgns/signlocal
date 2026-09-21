// Everything here runs in the browser. Photos are never sent anywhere.

export const MAX_EDGE = 2200; // long edge in pixels: ~200 dpi on a Letter page, keeps printed text sharp
export const JPEG_QUALITY = 0.82;

const SUPPORTED = ['image/jpeg', 'image/png', 'image/webp'];

export function checkImageFile(file) {
  const type = (file.type || '').toLowerCase();
  const name = (file.name || '').toLowerCase();
  if (SUPPORTED.includes(type)) return { ok: true };
  if (type.includes('heic') || type.includes('heif') || /\.(heic|heif)$/.test(name)) {
    return { ok: false, message: `${file.name} is a HEIC photo, which this browser cannot open. Use Take photo instead, or export it as a JPEG first.` };
  }
  return { ok: false, message: `${file.name} is not a photo SignLocal can use. Choose a JPEG, PNG, or WebP.` };
}

export function fitWithin(width, height, maxEdge = MAX_EDGE) {
  const longest = Math.max(width, height);
  if (longest <= maxEdge) return { width, height };
  const scale = maxEdge / longest;
  return { width: Math.round(width * scale), height: Math.round(height * scale) };
}

export function rotatedSize(width, height, rotation) {
  return rotation % 180 === 0 ? { width, height } : { width: height, height: width };
}

export function movePage(pages, id, direction) {
  const from = pages.findIndex((page) => page.id === id);
  const to = from + direction;
  if (from < 0 || to < 0 || to >= pages.length) return pages;
  const next = [...pages];
  [next[from], next[to]] = [next[to], next[from]];
  return next;
}

export function rotatePage(pages, id, degrees) {
  return pages.map((page) => page.id === id ? { ...page, rotation: (page.rotation + degrees + 360) % 360 } : page);
}

export function removePage(pages, id, revoke = (url) => URL.revokeObjectURL(url)) {
  const gone = pages.find((page) => page.id === id);
  if (gone?.url) revoke(gone.url);
  return pages.filter((page) => page.id !== id);
}

export function releasePages(pages, revoke = (url) => URL.revokeObjectURL(url)) {
  pages.forEach((page) => { if (page.url) revoke(page.url); });
}

// Shrinks, rotates, and re-encodes one photo as a JPEG ready for the PDF.
// 'from-image' makes the browser apply the phone's EXIF rotation for us.
export async function preparePhoto(file, rotation = 0) {
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  try {
    const fitted = fitWithin(bitmap.width, bitmap.height);
    const out = rotatedSize(fitted.width, fitted.height, rotation);
    const canvas = document.createElement('canvas');
    canvas.width = out.width;
    canvas.height = out.height;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#fff'; // JPEG has no transparency
    ctx.fillRect(0, 0, out.width, out.height);
    ctx.translate(out.width / 2, out.height / 2);
    ctx.rotate(rotation * Math.PI / 180);
    ctx.drawImage(bitmap, -fitted.width / 2, -fitted.height / 2, fitted.width, fitted.height);
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', JPEG_QUALITY));
    canvas.width = 0;
    canvas.height = 0;
    if (!blob) throw new Error('encode failed');
    return { bytes: new Uint8Array(await blob.arrayBuffer()), width: out.width, height: out.height };
  } finally {
    bitmap.close();
  }
}
