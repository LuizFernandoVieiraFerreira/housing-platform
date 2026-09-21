import {
  CanActivate,
  ExecutionContext,
  Injectable,
} from '@nestjs/common';

import { UnauthenticatedError } from '../errors';
import type { AuthenticatedRequest } from './auth.types';
import { AuthorizationService } from './authorization.service';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly authorizationService: AuthorizationService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    if (!request.user) {
      throw new UnauthenticatedError();
    }

    await this.authorizationService.requireAdmin(request.user);
    return true;
  }
}
