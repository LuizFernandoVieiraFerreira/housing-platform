import { createParamDecorator, ExecutionContext } from '@nestjs/common';

import type { AuthUser } from './auth-user.model';
import type { AuthenticatedRequest } from './auth.types';

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthUser | undefined => {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    return request.user;
  },
);
