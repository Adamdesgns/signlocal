import { describe, expect, it, vi } from 'vitest';
import { checkImageFile, fitWithin, rotatedSize, movePage, rotatePage, removePage, MAX_EDGE } from './imagePipeline.js';

const file = (name, type) => ({ name, type });

describe('checkImageFile', () => {
  it('accepts JPEG, PNG, and WebP', () => {
    expect(checkImageFile(file('a.jpg', 'image/jpeg')).ok).toBe(true);
    expect(checkImageFile(file('a.png', 'image/png')).ok).toBe(true);
    expect(checkImageFile(file('a.webp', 'image/webp')).ok).toBe(true);
  });

  it('gives HEIC a recovery message instead of trying to decode it', () => {
    const byType = checkImageFile(file('IMG_1.HEIC', 'image/heic'));
    const byName = checkImageFile(file('IMG_1.heic', ''));
    expect(byType.ok).toBe(false);
    expect(byName.ok).toBe(false);
    expect(byType.message).toMatch(/JPEG/);
  });

  it('rejects everything else with a plain message', () => {
    const result = checkImageFile(file('notes.docx', 'application/msword'));
    expect(result.ok).toBe(false);
    expect(result.message).toMatch(/JPEG, PNG, or WebP/);
  });
});

describe('fitWithin', () => {
  it('leaves small images alone', () => {
    expect(fitWithin(800, 600)).toEqual({ width: 800, height: 600 });
  });

  it('shrinks a big phone photo to the max edge and keeps its shape', () => {
    const { width, height } = fitWithin(4032, 3024);
    expect(width).toBe(MAX_EDGE);
    expect(height).toBe(Math.round(3024 * MAX_EDGE / 4032));
  });
});

describe('rotatedSize', () => {
  it('swaps width and height for quarter turns only', () => {
    expect(rotatedSize(400, 300, 0)).toEqual({ width: 400, height: 300 });
    expect(rotatedSize(400, 300, 90)).toEqual({ width: 300, height: 400 });
    expect(rotatedSize(400, 300, 180)).toEqual({ width: 400, height: 300 });
    expect(rotatedSize(400, 300, 270)).toEqual({ width: 300, height: 400 });
  });
});

describe('page list edits', () => {
  const pages = [{ id: 'a', rotation: 0 }, { id: 'b', rotation: 0 }, { id: 'c', rotation: 270 }];

  it('moves a page up or down and ignores moves off the ends', () => {
    expect(movePage(pages, 'c', -1).map((p) => p.id)).toEqual(['a', 'c', 'b']);
    expect(movePage(pages, 'a', 1).map((p) => p.id)).toEqual(['b', 'a', 'c']);
    expect(movePage(pages, 'a', -1).map((p) => p.id)).toEqual(['a', 'b', 'c']);
    expect(movePage(pages, 'c', 1).map((p) => p.id)).toEqual(['a', 'b', 'c']);
  });

  it('rotates in quarter turns and wraps around', () => {
    expect(rotatePage(pages, 'a', 90)[0].rotation).toBe(90);
    expect(rotatePage(pages, 'a', -90)[0].rotation).toBe(270);
    expect(rotatePage(pages, 'c', 90)[2].rotation).toBe(0);
  });

  it('releases the thumbnail URL when a page is deleted', () => {
    const revoke = vi.fn();
    const withUrls = [{ id: 'a', url: 'blob:a' }, { id: 'b', url: 'blob:b' }];
    const left = removePage(withUrls, 'a', revoke);
    expect(left.map((p) => p.id)).toEqual(['b']);
    expect(revoke).toHaveBeenCalledTimes(1);
    expect(revoke).toHaveBeenCalledWith('blob:a');
  });
});
