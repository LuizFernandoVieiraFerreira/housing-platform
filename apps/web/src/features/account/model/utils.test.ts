import { describe, expect, it } from 'vitest';

import {
  canHostProperties,
  getDisplayName,
  getValidLanguage,
  isProfileComplete,
} from '@/features/account/model/utils';

describe('account model utils', () => {
  it('checks host capability by role', () => {
    expect(canHostProperties('host')).toBe(true);
    expect(canHostProperties('customer')).toBe(false);
  });

  it('detects complete profiles', () => {
    expect(
      isProfileComplete({
        id: '1',
        role: 'customer',
        full_name: 'Jane Doe',
        phone: null,
        avatar_url: null,
        preferred_language: 'en',
        marketing_consent: false,
        deleted_at: null,
        created_at: '',
        updated_at: '',
      }),
    ).toBe(true);
  });

  it('falls back display name', () => {
    expect(getDisplayName(null)).toBe('User');
  });

  it('normalizes unsupported languages to en', () => {
    expect(getValidLanguage('xx')).toBe('en');
    expect(getValidLanguage('ko')).toBe('ko');
  });
});
