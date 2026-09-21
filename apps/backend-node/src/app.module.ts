import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';

import { HealthModule } from './api/health/health.module';
import configuration from './config/configuration';
import { AdminModule } from './features/admin/admin.module';
import { BookingsModule } from './features/bookings/bookings.module';
import { HostsModule } from './features/hosts/hosts.module';
import { NotificationsModule } from './features/notifications/notifications.module';
import { PaymentsModule } from './features/payments/payments.module';
import { ProfileModule } from './features/profile/profile.module';
import { PropertiesModule } from './features/properties/properties.module';
import { PrismaModule } from './prisma/prisma.module';
import { AuthGuard, AuthModule } from './shared/auth';
import { RateLimitModule } from './shared/rate-limit/rate-limit.module';
import { StorageModule } from './shared/storage/storage.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    PrismaModule,
    AuthModule,
    HealthModule,
    PropertiesModule,
    BookingsModule,
    PaymentsModule,
    HostsModule,
    AdminModule,
    NotificationsModule,
    ProfileModule,
    RateLimitModule,
    StorageModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
  ],
})
export class AppModule {}
