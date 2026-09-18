import { describe, expect, it } from 'vitest';

import {
  canApproveHost,
  isAdminProfile,
  isOpenHousingRequest,
  isSuccessfulPayment,
} from '@/features/admin/model/utils';

describe('admin model utils', () => {
  it('detects admin profiles', () => {
    expect(isAdminProfile('admin')).toBe(true);
    expect(isAdminProfile('host')).toBe(false);
  });

  it('checks host approval eligibility', () => {
    expect(canApproveHost('pending')).toBe(true);
    expect(canApproveHost('active')).toBe(false);
  });

  it('checks housing request state', () => {
    expect(isOpenHousingRequest('new')).toBe(true);
    expect(isOpenHousingRequest('closed')).toBe(false);
  });

  it('checks payment success state', () => {
    expect(isSuccessfulPayment('confirmed')).toBe(true);
    expect(isSuccessfulPayment('failed')).toBe(false);
  });
});
