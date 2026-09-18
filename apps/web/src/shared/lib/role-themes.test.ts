import {
  resolveExplicitPathThemeKey,
  resolvePathThemeKey,
} from '@housing-platform/config/design-tokens/role-themes';
import { describe, expect, it } from 'vitest';

import { PROFESSIONAL_PLATFORMS } from '@/features/platforms';

describe('resolveExplicitPathThemeKey', () => {
  it('claims host pages for the host palette', () => {
    for (const path of ['/for-hosts', '/host/login', '/host/signup']) {
      expect(resolveExplicitPathThemeKey(path)).toBe('host');
    }
  });

  it('claims admin pages for the admin palette', () => {
    expect(resolveExplicitPathThemeKey('/admin/login')).toBe('admin');
  });

  it('claims photographer pages for the violet palette', () => {
    expect(resolveExplicitPathThemeKey('/for-photographers')).toBe('photographer');
  });

  it('claims agent pages for the honey-gold palette', () => {
    expect(resolveExplicitPathThemeKey('/for-agents')).toBe('agent');
  });

  it('has no opinion on pages that belong to no single role', () => {
    for (const path of ['/', '/map', '/login', '/bookings', '/host/properties']) {
      expect(resolveExplicitPathThemeKey(path)).toBeUndefined();
    }
  });

  it('gives every platform landing page a theme', () => {
    for (const { landingPath } of PROFESSIONAL_PLATFORMS) {
      expect(resolveExplicitPathThemeKey(landingPath)).toBeDefined();
    }
  });
});

describe('resolvePathThemeKey', () => {
  it('falls back to the customer palette', () => {
    expect(resolvePathThemeKey('/')).toBe('customer');
    expect(resolvePathThemeKey('/for-hosts')).toBe('host');
    expect(resolvePathThemeKey('/for-photographers')).toBe('photographer');
    expect(resolvePathThemeKey('/for-agents')).toBe('agent');
  });
});
