import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  createRemoteJWKSet,
  decodeProtectedHeader,
  jwtVerify,
  type JWTPayload,
} from 'jose';

import type { AppConfiguration } from '../../config/configuration';
import { UnauthenticatedError } from '../errors';
import type { JwtClaims } from './auth.types';

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

@Injectable()
export class JwtValidatorService {
  private readonly audience: string;
  private readonly issuer: string;
  private readonly jwtSecret: Uint8Array | null;
  private readonly jwks: ReturnType<typeof createRemoteJWKSet>;

  constructor(private readonly config: ConfigService<AppConfiguration, true>) {
    const supabaseUrl = this.config.get('supabaseUrl', { infer: true });
    this.audience = this.config.get('supabaseJwtAudience', { infer: true });
    this.issuer = `${supabaseUrl.replace(/\/$/, '')}/auth/v1`;

    const secret = this.config.get('supabaseJwtSecret', { infer: true }).trim();
    this.jwtSecret = secret.length > 0 ? new TextEncoder().encode(secret) : null;

    this.jwks = createRemoteJWKSet(
      new URL(`${this.issuer}/.well-known/jwks.json`),
    );
  }

  async validate(token: string): Promise<JwtClaims> {
    let payload: JWTPayload;

    try {
      payload = await this.decodeToken(token);
    } catch {
      throw new UnauthenticatedError('Invalid or expired access token');
    }

    return this.toClaims(payload);
  }

  private async decodeToken(token: string): Promise<JWTPayload> {
    const header = decodeProtectedHeader(token);
    const algorithm = header.alg;

    if (algorithm === 'HS256') {
      if (!this.jwtSecret) {
        throw new Error('HS256 token requires SUPABASE_JWT_SECRET');
      }

      const { payload } = await jwtVerify(token, this.jwtSecret, {
        algorithms: ['HS256'],
        audience: this.audience,
        issuer: this.issuer,
      });
      return payload;
    }

    if (typeof algorithm !== 'string') {
      throw new Error('Token header is missing a supported algorithm');
    }

    const { payload } = await jwtVerify(token, this.jwks, {
      algorithms: [algorithm],
      audience: this.audience,
    });
    return payload;
  }

  private toClaims(payload: JWTPayload): JwtClaims {
    if (payload.role !== 'authenticated') {
      throw new UnauthenticatedError(
        'Access token is not for an authenticated user',
      );
    }

    const subject = payload.sub;
    if (typeof subject !== 'string' || !UUID_PATTERN.test(subject)) {
      throw new UnauthenticatedError(
        'Access token is missing a valid subject',
      );
    }

    const email =
      typeof payload.email === 'string' && payload.email.length > 0
        ? payload.email
        : null;

    return {
      userId: subject,
      email,
    };
  }
}
