import { describe, expect, it } from 'vitest';

import {
  getAuthErrorMessage,
  getAuthenticatedHomePath,
  getSafeReturnTo,
  resolvePostLoginPath,
} from '@/features/auth/lib/auth-utils';

describe('getAuthErrorMessage', () => {
  it('returns Error message when available', () => {
    expect(getAuthErrorMessage(new Error('Invalid credentials'))).toBe('Invalid credentials');
  });

  it('returns message from error-like objects', () => {
    expect(getAuthErrorMessage({ message: 'Email not confirmed' })).toBe('Email not confirmed');
  });

  it('returns fallback for unknown error shapes', () => {
    expect(getAuthErrorMessage(null)).toBe('Something went wrong.');
    expect(getAuthErrorMessage(undefined, 'Login failed')).toBe('Login failed');
  });
});

describe('getSafeReturnTo', () => {
  it('returns fallback for unsafe values', () => {
    expect(getSafeReturnTo(null)).toBe('/account');
    expect(getSafeReturnTo('https://evil.test')).toBe('/account');
    expect(getSafeReturnTo('//evil.test')).toBe('/account');
    expect(getSafeReturnTo(null, '/host')).toBe('/host');
  });

  it('allows internal paths', () => {
    expect(getSafeReturnTo('/account/profile')).toBe('/account/profile');
  });
});

describe('getAuthenticatedHomePath', () => {
  it('routes by role', () => {
    expect(getAuthenticatedHomePath('admin')).toBe('/admin');
    expect(getAuthenticatedHomePath('host')).toBe('/host');
    expect(getAuthenticatedHomePath('customer')).toBe('/');
    expect(getAuthenticatedHomePath('customer', '/account')).toBe('/account');
    expect(getAuthenticatedHomePath(undefined, '/')).toBe('/');
  });
});

describe('resolvePostLoginPath', () => {
  it('honors an explicit returnTo query param', () => {
    expect(
      resolvePostLoginPath({
        returnToParam: '/bookings',
        defaultRedirectTo: '/',
        role: 'host',
      }),
    ).toBe('/bookings');
  });

  it('routes hosts and admins to their portal when returnTo is absent', () => {
    expect(
      resolvePostLoginPath({
        returnToParam: null,
        defaultRedirectTo: '/',
        role: 'host',
      }),
    ).toBe('/host');

    expect(
      resolvePostLoginPath({
        returnToParam: null,
        defaultRedirectTo: '/',
        role: 'admin',
      }),
    ).toBe('/admin');
  });

  it('falls back to the login entry default for customers', () => {
    expect(
      resolvePostLoginPath({
        returnToParam: null,
        defaultRedirectTo: '/',
        role: 'customer',
      }),
    ).toBe('/');
  });
});
