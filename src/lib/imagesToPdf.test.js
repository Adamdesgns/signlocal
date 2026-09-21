import { describe, expect, it } from 'vitest';
import { PDFDocument } from 'pdf-lib';
import { imagesToPdf, layoutOnPage, LETTER, MARGIN } from './imagesToPdf.js';

// Smallest valid JPEG pdf-lib will embed: a 1x1 white pixel.
const TINY_JPEG = Uint8Array.from(atob('/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAMCAgICAgMCAgIDAwMDBAYEBAQEBAgGBgUGCQgKCgkICQkKDA8MCgsOCwkJDRENDg8QEBEQCgwSExIQEw8QEBD/yQALCAABAAEBAREA/8wABgAQEAX/2gAIAQEAAD8A0s8g/9k='), (c) => c.charCodeAt(0));

describe('layoutOnPage', () => {
  it('uses a portrait Letter page for a portrait photo', () => {
    const box = layoutOnPage(3000, 4000);
    expect(box.pageWidth).toBe(LETTER.width);
    expect(box.pageHeight).toBe(LETTER.height);
  });

  it('turns the page sideways for a landscape photo', () => {
    const box = layoutOnPage(4000, 3000);
    expect(box.pageWidth).toBe(LETTER.height);
    expect(box.pageHeight).toBe(LETTER.width);
  });

  it('fits the photo inside the margins, centered, without stretching it', () => {
    const box = layoutOnPage(3000, 4000);
    expect(box.width).toBeLessThanOrEqual(box.pageWidth - MARGIN * 2 + 0.01);
    expect(box.height).toBeLessThanOrEqual(box.pageHeight - MARGIN * 2 + 0.01);
    expect(box.width / box.height).toBeCloseTo(3000 / 4000, 5);
    expect(box.x).toBeCloseTo((box.pageWidth - box.width) / 2, 5);
    expect(box.y).toBeCloseTo((box.pageHeight - box.height) / 2, 5);
  });
});

describe('imagesToPdf', () => {
  it('makes one page per photo, in order, at Letter size', async () => {
    const bytes = await imagesToPdf([
      { bytes: TINY_JPEG, width: 3000, height: 4000 },
      { bytes: TINY_JPEG, width: 4000, height: 3000 },
      { bytes: TINY_JPEG, width: 3000, height: 4000 },
    ]);
    const doc = await PDFDocument.load(bytes);
    expect(doc.getPageCount()).toBe(3);
    expect(doc.getPage(0).getSize()).toEqual({ width: 612, height: 792 });
    expect(doc.getPage(1).getSize()).toEqual({ width: 792, height: 612 });
    expect(doc.getPage(2).getSize()).toEqual({ width: 612, height: 792 });
  });

  it('refuses an empty page list', async () => {
    await expect(imagesToPdf([])).rejects.toThrow();
  });
});
