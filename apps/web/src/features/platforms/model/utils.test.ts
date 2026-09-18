import { describe, expect, it } from 'vitest';

import {
  getProfessionalPlatform,
  isPlatformOpen,
} from '@/features/platforms/model/utils';

describe('platforms model utils', () => {
  it('returns platform config by key', () => {
    expect(getProfessionalPlatform('host').landingPath).toBe('/for-hosts');
  });

  it('detects platforms with auth surfaces', () => {
    expect(isPlatformOpen(getProfessionalPlatform('host'))).toBe(true);
    expect(isPlatformOpen(getProfessionalPlatform('photographer'))).toBe(false);
  });
});
