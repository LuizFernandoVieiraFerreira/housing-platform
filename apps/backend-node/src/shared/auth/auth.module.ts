import { Global, Module } from '@nestjs/common';

import { AdminGuard } from './admin.guard';
import { AuthGuard } from './auth.guard';
import { AuthorizationService } from './authorization.service';
import { JwtValidatorService } from './jwt-validator.service';
import { OptionalAuthGuard } from './optional-auth.guard';

@Global()
@Module({
  providers: [
    JwtValidatorService,
    AuthorizationService,
    AuthGuard,
    OptionalAuthGuard,
    AdminGuard,
  ],
  exports: [
    JwtValidatorService,
    AuthorizationService,
    AuthGuard,
    OptionalAuthGuard,
    AdminGuard,
  ],
})
export class AuthModule {}
