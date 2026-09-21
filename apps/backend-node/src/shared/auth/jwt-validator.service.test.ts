import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'node:crypto';
import { beforeEach, describe, expect, it } from 'vitest';

import type { AppConfiguration } from '../../config/configuration';
import { UnauthenticatedError } from '../errors';
import { JwtValidatorService } from './jwt-validator.service';
import {
  buildToken,
  JWT_SECRET,
  SUPABASE_URL,
} from './test/jwt-test-utils';

function createValidator(jwtSecret = JWT_SECRET): JwtValidatorService {
  const config = {
    get: (key: keyof AppConfiguration) => {
      switch (key) {
        case 'supabaseUrl':
          return SUPABASE_URL;
        case 'supabaseJwtSecret':
          return jwtSecret;
        case 'supabaseJwtAudience':
          return 'authenticated';
        default:
          throw new Error(`Unexpected config key: ${String(key)}`);
      }
    },
  };

  return new JwtValidatorService(
    config as unknown as ConfigService<AppConfiguration, true>,
  );
}

describe('JwtValidatorService', () => {
  let validator: JwtValidatorService;

  beforeEach(() => {
    validator = createValidator();
  });

  it('accepts authenticated user tokens', async () => {
    const userId = randomUUID();
    const token = await buildToken({ userId });

    const claims = await validator.validate(token);

    expect(claims.userId).toBe(userId);
    expect(claims.email).toBe('test@example.com');
  });

  it('rejects expired tokens', async () => {
    const token = await buildToken({ expired: true });

    await expect(validator.validate(token)).rejects.toMatchObject({
      message: 'Invalid or expired access token',
    });
  });

  it('rejects service_role tokens', async () => {
    const token = await buildToken({ role: 'service_role' });

    await expect(validator.validate(token)).rejects.toBeInstanceOf(
      UnauthenticatedError,
    );
    await expect(validator.validate(token)).rejects.toMatchObject({
      message: 'Access token is not for an authenticated user',
    });
  });

  it('rejects anon tokens', async () => {
    const token = await buildToken({ role: 'anon' });

    await expect(validator.validate(token)).rejects.toMatchObject({
      message: 'Access token is not for an authenticated user',
    });
  });

  it('requires jwt secret for HS256 tokens', async () => {
    const validatorWithoutSecret = createValidator('');
    const token = await buildToken();

    await expect(validatorWithoutSecret.validate(token)).rejects.toMatchObject({
      message: 'Invalid or expired access token',
    });
  });
});
