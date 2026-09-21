import { Injectable } from '@nestjs/common';
import { user_role } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';
import { ForbiddenError, UnauthenticatedError } from '../errors';
import { AuthUser, UserRole } from './auth-user.model';

@Injectable()
export class AuthorizationService {
  constructor(private readonly prisma: PrismaService) {}

  async resolveAuthUser(
    userId: string,
    email: string | null,
  ): Promise<AuthUser> {
    const profile = await this.prisma.profiles.findFirst({
      where: {
        id: userId,
        deleted_at: null,
      },
    });

    if (!profile) {
      throw new UnauthenticatedError('User profile not found');
    }

    return {
      id: profile.id,
      email,
      role: this.toUserRole(profile.role),
    };
  }

  async isAdmin(userId: string): Promise<boolean> {
    const count = await this.prisma.profiles.count({
      where: {
        id: userId,
        role: user_role.admin,
        deleted_at: null,
      },
    });

    return count > 0;
  }

  async getHostIdForProfile(userId: string): Promise<string | null> {
    const host = await this.prisma.hosts.findFirst({
      where: {
        profile_id: userId,
        deleted_at: null,
      },
      select: { id: true },
    });

    return host?.id ?? null;
  }

  async isHostOfProperty(
    userId: string,
    propertyId: string,
  ): Promise<boolean> {
    const count = await this.prisma.properties.count({
      where: {
        id: propertyId,
        deleted_at: null,
        hosts: {
          profile_id: userId,
          deleted_at: null,
        },
      },
    });

    return count > 0;
  }

  async isHostOfBooking(userId: string, bookingId: string): Promise<boolean> {
    const booking = await this.prisma.bookings.findUnique({
      where: { id: bookingId },
      select: { property_id: true },
    });

    if (!booking) {
      return false;
    }

    return this.isHostOfProperty(userId, booking.property_id);
  }

  async requireAdmin(user: AuthUser): Promise<void> {
    if (!(await this.isAdmin(user.id))) {
      throw new ForbiddenError('Admin access required');
    }
  }

  async requireHostOfProperty(
    user: AuthUser,
    propertyId: string,
  ): Promise<void> {
    if (!(await this.isHostOfProperty(user.id, propertyId))) {
      throw new ForbiddenError(
        'Only the host of this property can perform this action',
      );
    }
  }

  async requireHostOfBooking(user: AuthUser, bookingId: string): Promise<void> {
    if (
      !(await this.isAdmin(user.id)) &&
      !(await this.isHostOfBooking(user.id, bookingId))
    ) {
      throw new ForbiddenError(
        'Only the host of this booking can perform this action',
      );
    }
  }

  private toUserRole(role: user_role): UserRole {
    switch (role) {
      case user_role.admin:
        return UserRole.Admin;
      case user_role.host:
        return UserRole.Host;
      case user_role.customer:
        return UserRole.Customer;
    }
  }
}
