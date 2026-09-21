import {
  CanActivate,
  ExecutionContext,
  Injectable,
} from '@nestjs/common';

import type { AuthenticatedRequest } from './auth.types';
import { AuthorizationService } from './authorization.service';
import { extractBearerToken } from './extract-bearer-token';
import { JwtValidatorService } from './jwt-validator.service';

@Injectable()
export class OptionalAuthGuard implements CanActivate {
  constructor(
    private readonly jwtValidator: JwtValidatorService,
    private readonly authorizationService: AuthorizationService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = extractBearerToken(request);

    if (!token) {
      request.user = undefined;
      return true;
    }

    const claims = await this.jwtValidator.validate(token);
    request.user = await this.authorizationService.resolveAuthUser(
      claims.userId,
      claims.email,
    );

    return true;
  }
}
