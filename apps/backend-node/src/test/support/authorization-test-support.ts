import { INestApplication, Provider, Type } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD, Reflector } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import type { user_role } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { vi } from 'vitest';

import configuration, {
  type AppConfiguration,
} from '../../config/configuration';
import { PrismaService } from '../../prisma/prisma.service';
import {
  AuthGuard,
  AuthorizationService,
  AuthUser,
  JwtValidatorService,
  OptionalAuthGuard,
  UserRole,
} from '../../shared/auth';
import {
  JWT_SECRET,
  SUPABASE_URL,
  buildToken,
} from '../../shared/auth/test/jwt-test-utils';
import { AppErrorFilter } from '../../shared/errors';
import { API_PREFIX } from './contract';

export { API_PREFIX };

export interface PrismaMock {
  profiles: {
    findFirst: ReturnType<typeof vi.fn>;
    count: ReturnType<typeof vi.fn>;
  };
  hosts: {
    findFirst: ReturnType<typeof vi.fn>;
  };
  properties: {
    count: ReturnType<typeof vi.fn>;
  };
  bookings: {
    findUnique: ReturnType<typeof vi.fn>;
  };
  $transaction: ReturnType<typeof vi.fn>;
}

export function createCustomer(
  userId = randomUUID(),
  email = 'customer@example.com',
): AuthUser {
  return { id: userId, email, role: UserRole.Customer };
}

export function createHost(
  userId = randomUUID(),
  email = 'host@example.com',
): AuthUser {
  return { id: userId, email, role: UserRole.Host };
}

export function createPrismaMock(): PrismaMock {
  const prisma: PrismaMock = {
    profiles: {
      findFirst: vi.fn(),
      count: vi.fn(),
    },
    hosts: {
      findFirst: vi.fn(),
    },
    properties: {
      count: vi.fn(),
    },
    bookings: {
      findUnique: vi.fn(),
    },
    $transaction: vi.fn(),
  };

  prisma.$transaction.mockImplementation(async (callback: (tx: PrismaMock) => unknown) =>
    callback(prisma),
  );

  return prisma;
}

function toPrismaRole(role: UserRole): user_role {
  switch (role) {
    case UserRole.Admin:
      return 'admin';
    case UserRole.Host:
      return 'host';
    default:
      return 'customer';
  }
}

export function stubAuthUser(prisma: PrismaMock, user: AuthUser): void {
  prisma.profiles.findFirst.mockResolvedValue({
    id: user.id,
    role: toPrismaRole(user.role),
    deleted_at: null,
  });

  prisma.profiles.count.mockImplementation(
    (args: { where?: { id?: string; role?: user_role } }) => {
      if (
        args.where?.role === 'admin' &&
        args.where.id === user.id &&
        user.role === UserRole.Admin
      ) {
        return Promise.resolve(1);
      }

      return Promise.resolve(0);
    },
  );
}

export function stubNonAdmin(prisma: PrismaMock): void {
  prisma.profiles.count.mockResolvedValue(0);
  prisma.properties.count.mockResolvedValue(0);
}

export async function buildBearerHeader(user: AuthUser): Promise<string> {
  const token = await buildToken({ userId: user.id });
  return `Bearer ${token}`;
}

function testConfiguration(): AppConfiguration {
  return {
    ...configuration(),
    supabaseUrl: SUPABASE_URL,
    supabaseJwtSecret: JWT_SECRET,
    supabaseJwtAudience: 'authenticated',
  };
}

function createTestConfigService(): ConfigService<AppConfiguration, true> {
  const config = testConfiguration();

  return {
    get: <K extends keyof AppConfiguration>(key: K) => config[key],
  } as ConfigService<AppConfiguration, true>;
}

function createJwtValidatorService(): JwtValidatorService {
  return new JwtValidatorService(createTestConfigService());
}

export function hostPropertyPayload(): Record<string, unknown> {
  return {
    title: 'Cozy Studio in Hongdae',
    description: 'A bright studio close to the subway with everything you need.',
    propertyType: 'studio',
    addressLine1: '123 Test Street',
    city: 'Seoul',
    district: 'Mapo-gu',
    bookingMode: 'request',
    minStayNights: 30,
  };
}

export interface AuthorizationTestApp {
  app: INestApplication;
  moduleRef: TestingModule;
  prisma: PrismaMock;
  request: ReturnType<typeof request>;
}

export async function createAuthorizationTestApp(options: {
  controllers: Type[];
  providers: Provider[];
  prisma?: PrismaMock;
}): Promise<AuthorizationTestApp> {
  const prisma = options.prisma ?? createPrismaMock();

  const moduleRef = await Test.createTestingModule({
    imports: [
      ConfigModule.forRoot({
        isGlobal: true,
        load: [testConfiguration],
      }),
    ],
    controllers: options.controllers,
    providers: [
      ...options.providers,
      { provide: PrismaService, useValue: prisma },
      { provide: ConfigService, useValue: createTestConfigService() },
      { provide: JwtValidatorService, useValue: createJwtValidatorService() },
      AuthorizationService,
      Reflector,
      {
        provide: AuthGuard,
        useFactory: (
          reflector: Reflector,
          jwtValidator: JwtValidatorService,
          authorizationService: AuthorizationService,
        ) => new AuthGuard(reflector, jwtValidator, authorizationService),
        inject: [Reflector, JwtValidatorService, AuthorizationService],
      },
      {
        provide: OptionalAuthGuard,
        useFactory: (
          jwtValidator: JwtValidatorService,
          authorizationService: AuthorizationService,
        ) => new OptionalAuthGuard(jwtValidator, authorizationService),
        inject: [JwtValidatorService, AuthorizationService],
      },
      { provide: APP_GUARD, useExisting: AuthGuard },
    ],
  }).compile();

  const app = moduleRef.createNestApplication();
  app.useGlobalFilters(new AppErrorFilter());
  app.setGlobalPrefix(API_PREFIX);
  await app.init();

  return {
    app,
    moduleRef,
    prisma,
    request: request(app.getHttpServer()),
  };
}

export async function closeAuthorizationTestApp(
  testApp: AuthorizationTestApp,
): Promise<void> {
  await testApp.app.close();
}
