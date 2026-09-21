import {
  CanActivate,
  ExecutionContext,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { UnauthenticatedError } from '../errors';
import { IS_PUBLIC_KEY } from './auth.constants';
import type { AuthenticatedRequest } from './auth.types';
import { AuthorizationService } from './authorization.service';
import { extractBearerToken } from './extract-bearer-token';
import { JwtValidatorService } from './jwt-validator.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwtValidator: JwtValidatorService,
    private readonly authorizationService: AuthorizationService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = extractBearerToken(request);

    if (!token) {
      throw new UnauthenticatedError();
    }

    const claims = await this.jwtValidator.validate(token);
    request.user = await this.authorizationService.resolveAuthUser(
      claims.userId,
      claims.email,
    );

    return true;
  }
}
