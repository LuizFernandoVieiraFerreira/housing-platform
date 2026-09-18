import { describe, expect, it } from 'vitest';

import {
  getAuthenticatedHomePath,
  getSafeReturnTo,
  isValidInternalPath,
  mapSupabaseErrorCode,
  resolvePostLoginPath,
} from '@/features/auth/model/utils';

describe('auth model utils', () => {
  it('blocks open redirects in returnTo', () => {
    expect(getSafeReturnTo('//evil.com')).toBe('/account');
    expect(getSafeReturnTo('/bookings')).toBe('/bookings');
  });

  it('resolves post-login path from role', () => {
    expect(
      resolvePostLoginPath({
        returnToParam: null,
        defaultRedirectTo: '/account',
        role: 'admin',
      }),
    ).toBe('/admin');
  });

  it('maps supabase auth error codes', () => {
    expect(mapSupabaseErrorCode('invalid_credentials')).toBe('INVALID_CREDENTIALS');
    expect(mapSupabaseErrorCode('unknown_code')).toBe('UNKNOWN');
  });

  it('validates internal paths', () => {
    expect(isValidInternalPath('/search')).toBe(true);
    expect(isValidInternalPath('//search')).toBe(false);
  });

  it('routes authenticated users by role', () => {
    expect(getAuthenticatedHomePath('host')).toBe('/host');
    expect(getAuthenticatedHomePath('customer')).toBe('/');
  });
});
