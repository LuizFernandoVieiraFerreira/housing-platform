import type { Request } from 'express';

import type { AuthUser } from './auth-user.model';

export interface JwtClaims {
  userId: string;
  email: string | null;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}
