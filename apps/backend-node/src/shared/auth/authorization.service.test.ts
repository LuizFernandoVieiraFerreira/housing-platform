import { user_role } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { PrismaService } from '../../prisma/prisma.service';
import { ForbiddenError, UnauthenticatedError } from '../errors';
import { AuthUser, UserRole } from './auth-user.model';
import { AuthorizationService } from './authorization.service';

describe('AuthorizationService', () => {
  let prisma: {
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
  };
  let service: AuthorizationService;

  beforeEach(() => {
    prisma = {
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
    };

    service = new AuthorizationService(prisma as unknown as PrismaService);
  });

  it('resolveAuthUser returns profile role', async () => {
    const profileId = randomUUID();
    prisma.profiles.findFirst.mockResolvedValue({
      id: profileId,
      role: user_role.host,
    });

    const user = await service.resolveAuthUser(profileId, 'host@example.com');

    expect(user).toEqual({
      id: profileId,
      email: 'host@example.com',
      role: UserRole.Host,
    });
  });

  it('resolveAuthUser rejects missing profile', async () => {
    prisma.profiles.findFirst.mockResolvedValue(null);

    await expect(
      service.resolveAuthUser(randomUUID(), null),
    ).rejects.toMatchObject({
      message: 'User profile not found',
    });
  });

  it('isAdmin checks deleted_at via query filter', async () => {
    prisma.profiles.count.mockResolvedValue(1);

    await expect(service.isAdmin(randomUUID())).resolves.toBe(true);
    expect(prisma.profiles.count).toHaveBeenCalledWith({
      where: {
        id: expect.any(String),
        role: user_role.admin,
        deleted_at: null,
      },
    });
  });

  it('requireAdmin raises for non-admin', async () => {
    prisma.profiles.count.mockResolvedValue(0);
    const user: AuthUser = {
      id: randomUUID(),
      email: 'user@example.com',
      role: UserRole.Customer,
    };

    await expect(service.requireAdmin(user)).rejects.toBeInstanceOf(
      ForbiddenError,
    );
    await expect(service.requireAdmin(user)).rejects.toMatchObject({
      message: 'Admin access required',
    });
  });

  it('getHostIdForProfile returns host id', async () => {
    const hostId = randomUUID();
    prisma.hosts.findFirst.mockResolvedValue({ id: hostId });

    await expect(service.getHostIdForProfile(randomUUID())).resolves.toBe(
      hostId,
    );
  });

  it('isHostOfProperty uses property ownership query', async () => {
    prisma.properties.count.mockResolvedValue(1);

    await expect(
      service.isHostOfProperty(randomUUID(), randomUUID()),
    ).resolves.toBe(true);
  });

  it('isHostOfBooking returns false when booking is missing', async () => {
    prisma.bookings.findUnique.mockResolvedValue(null);

    await expect(
      service.isHostOfBooking(randomUUID(), randomUUID()),
    ).resolves.toBe(false);
  });

  it('isHostOfBooking delegates to property ownership check', async () => {
    const propertyId = randomUUID();
    prisma.bookings.findUnique.mockResolvedValue({ property_id: propertyId });
    prisma.properties.count.mockResolvedValue(1);

    await expect(
      service.isHostOfBooking(randomUUID(), randomUUID()),
    ).resolves.toBe(true);
  });

  it('requireHostOfProperty raises for non-host', async () => {
    prisma.properties.count.mockResolvedValue(0);
    const user: AuthUser = {
      id: randomUUID(),
      email: 'user@example.com',
      role: UserRole.Customer,
    };

    await expect(
      service.requireHostOfProperty(user, randomUUID()),
    ).rejects.toMatchObject({
      message: 'Only the host of this property can perform this action',
    });
  });

  it('requireHostOfBooking allows admin', async () => {
    prisma.profiles.count.mockResolvedValue(1);
    const admin: AuthUser = {
      id: randomUUID(),
      email: 'admin@example.com',
      role: UserRole.Admin,
    };

    await expect(
      service.requireHostOfBooking(admin, randomUUID()),
    ).resolves.toBeUndefined();
  });

  it('resolveAuthUser surfaces missing profile as unauthenticated', async () => {
    prisma.profiles.findFirst.mockResolvedValue(null);

    await expect(
      service.resolveAuthUser(randomUUID(), 'deps@example.com'),
    ).rejects.toBeInstanceOf(UnauthenticatedError);
  });
});
