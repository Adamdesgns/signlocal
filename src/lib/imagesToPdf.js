import { PDFDocument } from 'pdf-lib';

export const LETTER = { width: 612, height: 792 }; // points, 8.5 x 11 in
export const MARGIN = 18; // quarter inch

export function layoutOnPage(imageWidth, imageHeight) {
  const landscape = imageWidth > imageHeight;
  const pageWidth = landscape ? LETTER.height : LETTER.width;
  const pageHeight = landscape ? LETTER.width : LETTER.height;
  const scale = Math.min((pageWidth - MARGIN * 2) / imageWidth, (pageHeight - MARGIN * 2) / imageHeight);
  const width = imageWidth * scale;
  const height = imageHeight * scale;
  return { pageWidth, pageHeight, width, height, x: (pageWidth - width) / 2, y: (pageHeight - height) / 2 };
}

// photos: [{ bytes: JPEG Uint8Array, width, height }] in page order
export async function imagesToPdf(photos) {
  if (!photos.length) throw new Error('No photos to convert.');
  const doc = await PDFDocument.create();
  for (const photo of photos) {
    const image = await doc.embedJpg(photo.bytes);
    const box = layoutOnPage(photo.width, photo.height);
    const page = doc.addPage([box.pageWidth, box.pageHeight]);
    page.drawImage(image, { x: box.x, y: box.y, width: box.width, height: box.height });
  }
  return doc.save();
}
