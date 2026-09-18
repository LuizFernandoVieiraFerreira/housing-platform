import { describe, expect, it } from 'vitest';

import {
  findCoverImage,
  hasValidPrice,
  isAbsoluteUrl,
  isPublicProperty,
} from '@/features/listings/model/utils';

describe('listings model utils', () => {
  it('finds explicit cover image', () => {
    const cover = findCoverImage([
      { storage_path: 'a.jpg', alt_text: null, is_cover: false, sort_order: 1 },
      { storage_path: 'cover.jpg', alt_text: 'Cover', is_cover: true, sort_order: 0 },
    ]);

    expect(cover?.storage_path).toBe('cover.jpg');
  });

  it('validates monthly price', () => {
    expect(hasValidPrice(900_000)).toBe(true);
    expect(hasValidPrice(null)).toBe(false);
  });

  it('detects public property statuses', () => {
    expect(isPublicProperty('published')).toBe(true);
    expect(isPublicProperty('draft')).toBe(false);
  });

  it('detects absolute image urls', () => {
    expect(isAbsoluteUrl('https://cdn.example/image.jpg')).toBe(true);
    expect(isAbsoluteUrl('properties/cover.jpg')).toBe(false);
  });
});
