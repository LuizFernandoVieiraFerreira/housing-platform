import { describe, expect, it } from 'vitest';

import {
  canEditProperty,
  canHostCreateProperty,
  isHostProfile,
  parseTags,
} from '@/features/host/model/utils';

describe('host model utils', () => {
  it('detects host-capable roles', () => {
    expect(isHostProfile('host')).toBe(true);
    expect(isHostProfile('admin')).toBe(true);
    expect(isHostProfile('customer')).toBe(false);
  });

  it('checks property edit permissions by status', () => {
    expect(canEditProperty('draft')).toBe(true);
    expect(canEditProperty('published')).toBe(true);
    expect(canEditProperty('archived')).toBe(false);
  });

  it('allows active hosts to create properties', () => {
    expect(canHostCreateProperty('active')).toBe(true);
    expect(canHostCreateProperty('suspended')).toBe(false);
  });

  it('parses comma-separated tags', () => {
    expect(parseTags('quiet, furnished , ')).toEqual(['quiet', 'furnished']);
    expect(parseTags(undefined)).toEqual([]);
  });
});
