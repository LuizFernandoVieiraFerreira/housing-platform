import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { UnauthenticatedError } from '../errors';
import { AuthUser, UserRole } from './auth-user.model';
import { AuthGuard } from './auth.guard';
import { AuthorizationService } from './authorization.service';
import type { AuthenticatedRequest } from './auth.types';
import { JwtValidatorService } from './jwt-validator.service';
import { OptionalAuthGuard } from './optional-auth.guard';

function createExecutionContext(
  request: Partial<AuthenticatedRequest>,
): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => request,
    }),
    getHandler: () => ({}),
    getClass: () => ({}),
  } as ExecutionContext;
}

describe('AuthGuard', () => {
  let reflector: Reflector;
  let jwtValidator: { validate: ReturnType<typeof vi.fn> };
  let authorizationService: { resolveAuthUser: ReturnType<typeof vi.fn> };
  let guard: AuthGuard;

  beforeEach(() => {
    reflector = new Reflector();
    jwtValidator = { validate: vi.fn() };
    authorizationService = { resolveAuthUser: vi.fn() };
    guard = new AuthGuard(
      reflector,
      jwtValidator as unknown as JwtValidatorService,
      authorizationService as unknown as AuthorizationService,
    );
  });

  it('throws unauthenticated error when token is missing', async () => {
    const context = createExecutionContext({ headers: {} });

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
      UnauthenticatedError,
    );
  });

  it('attaches resolved user for valid token', async () => {
    const request: AuthenticatedRequest = {
      headers: { authorization: 'Bearer valid-token' },
    } as AuthenticatedRequest;
    const user: AuthUser = {
      id: '11111111-1111-4111-8111-111111111111',
      email: 'deps@example.com',
      role: UserRole.Customer,
    };

    jwtValidator.validate.mockResolvedValue({
      userId: user.id,
      email: user.email,
    });
    authorizationService.resolveAuthUser.mockResolvedValue(user);

    await expect(guard.canActivate(createExecutionContext(request))).resolves.toBe(
      true,
    );
    expect(request.user).toEqual(user);
  });

  it('rejects invalid tokens', async () => {
    jwtValidator.validate.mockRejectedValue(
      new UnauthenticatedError('Invalid or expired access token'),
    );

    await expect(
      guard.canActivate(
        createExecutionContext({
          headers: { authorization: 'Bearer invalid-token' },
        }),
      ),
    ).rejects.toMatchObject({
      message: 'Invalid or expired access token',
    });
  });

  it('skips authentication for public routes', async () => {
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);

    await expect(
      guard.canActivate(createExecutionContext({ headers: {} })),
    ).resolves.toBe(true);
    expect(jwtValidator.validate).not.toHaveBeenCalled();
  });
});

describe('OptionalAuthGuard', () => {
  let jwtValidator: { validate: ReturnType<typeof vi.fn> };
  let authorizationService: { resolveAuthUser: ReturnType<typeof vi.fn> };
  let guard: OptionalAuthGuard;

  beforeEach(() => {
    jwtValidator = { validate: vi.fn() };
    authorizationService = { resolveAuthUser: vi.fn() };
    guard = new OptionalAuthGuard(
      jwtValidator as unknown as JwtValidatorService,
      authorizationService as unknown as AuthorizationService,
    );
  });

  it('allows anonymous access without token', async () => {
    const request: AuthenticatedRequest = { headers: {} } as AuthenticatedRequest;

    await expect(guard.canActivate(createExecutionContext(request))).resolves.toBe(
      true,
    );
    expect(request.user).toBeUndefined();
  });

  it('resolves user when token is present', async () => {
    const request: AuthenticatedRequest = {
      headers: { authorization: 'Bearer valid-token' },
    } as AuthenticatedRequest;
    const user: AuthUser = {
      id: '11111111-1111-4111-8111-111111111111',
      email: 'deps@example.com',
      role: UserRole.Customer,
    };

    jwtValidator.validate.mockResolvedValue({
      userId: user.id,
      email: user.email,
    });
    authorizationService.resolveAuthUser.mockResolvedValue(user);

    await expect(guard.canActivate(createExecutionContext(request))).resolves.toBe(
      true,
    );
    expect(request.user).toEqual(user);
  });
});
