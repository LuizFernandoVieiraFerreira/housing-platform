import { createParamDecorator, ExecutionContext } from '@nestjs/common';

import { UnauthenticatedError } from '../errors';
import type { AuthUser } from './auth-user.model';
import type { AuthenticatedRequest } from './auth.types';

export const RequireUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthUser => {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    if (!request.user) {
      throw new UnauthenticatedError();
    }

    return request.user;
  },
);
