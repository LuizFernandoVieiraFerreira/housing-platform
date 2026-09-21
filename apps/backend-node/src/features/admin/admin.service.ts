import { Injectable } from '@nestjs/common';

import type { AuthUser } from '../../shared/auth/auth-user.model';
import { AuthorizationService } from '../../shared/auth/authorization.service';
import { BadRequestError, NotFoundError } from '../../shared/errors';
import type { HostBookingDto } from '../hosts/dto/host-booking.dto';
import type { HostDto } from '../hosts/dto/host.dto';
import { mapHost, mapHostBooking } from '../hosts/mappers/host.mapper';
import type { PropertyStatusChange } from '../properties/dto/property-status-change';
import type {
  AdminDashboardStatsDto,
  AdminHostDto,
  AdminPaymentDto,
  AdminPropertyDto,
  AuditLogDto,
  HousingRequestDto,
  UpdateHousingRequestStatusDto,
} from './dto';
import {
  mapAdminHost,
  mapAdminPayment,
  mapAdminProperty,
  mapAuditLog,
  mapHousingRequest,
  mapPropertyStatusChange,
} from './mappers/admin.mapper';
import { AdminRepository } from './admin.repository';

@Injectable()
export class AdminService {
  constructor(
    private readonly repository: AdminRepository,
    private readonly auth: AuthorizationService,
  ) {}

  async getDashboardStats(user: AuthUser): Promise<AdminDashboardStatsDto> {
    await this.auth.requireAdmin(user);
    return this.repository.getDashboardStats();
  }

  async listProperties(user: AuthUser): Promise<AdminPropertyDto[]> {
    await this.auth.requireAdmin(user);
    const rows = await this.repository.listProperties();
    return rows.map(mapAdminProperty);
  }

  async publishProperty(
    user: AuthUser,
    propertyId: string,
  ): Promise<PropertyStatusChange> {
    await this.auth.requireAdmin(user);

    const propertyRow = await this.repository.publishProperty(propertyId);
    if (!propertyRow) {
      throw new BadRequestError(
        'Property must be pending review before it can be published',
      );
    }

    await this.repository.writeAuditLog({
      actorId: user.id,
      action: 'property.published',
      entityType: 'property',
      entityId: propertyRow.id,
      metadata: { title: propertyRow.title, slug: propertyRow.slug },
    });

    return mapPropertyStatusChange(propertyRow.id, propertyRow.status);
  }

  async rejectPropertyReview(
    user: AuthUser,
    propertyId: string,
  ): Promise<PropertyStatusChange> {
    await this.auth.requireAdmin(user);

    const propertyRow = await this.repository.rejectPropertyReview(propertyId);
    if (!propertyRow) {
      throw new BadRequestError(
        'Property must be pending review before it can be rejected',
      );
    }

    await this.repository.writeAuditLog({
      actorId: user.id,
      action: 'property.review_rejected',
      entityType: 'property',
      entityId: propertyRow.id,
      metadata: { title: propertyRow.title, slug: propertyRow.slug },
    });

    return mapPropertyStatusChange(propertyRow.id, propertyRow.status);
  }

  async listHosts(user: AuthUser): Promise<AdminHostDto[]> {
    await this.auth.requireAdmin(user);
    const rows = await this.repository.listHosts();
    return rows.map(mapAdminHost);
  }

  async approveHost(user: AuthUser, hostId: string): Promise<HostDto> {
    await this.auth.requireAdmin(user);

    const host = await this.repository.approveHost(hostId);
    if (!host) {
      throw new BadRequestError('Host must be pending before it can be approved');
    }

    await this.repository.writeAuditLog({
      actorId: user.id,
      action: 'host.approved',
      entityType: 'host',
      entityId: host.id,
      metadata: { displayName: host.display_name },
    });

    return mapHost(host);
  }

  async listBookings(user: AuthUser): Promise<HostBookingDto[]> {
    await this.auth.requireAdmin(user);
    const rows = await this.repository.listBookings();
    return rows.map(mapHostBooking);
  }

  async listPayments(user: AuthUser): Promise<AdminPaymentDto[]> {
    await this.auth.requireAdmin(user);
    const rows = await this.repository.listPayments();
    return rows.map(mapAdminPayment);
  }

  async listHousingRequests(user: AuthUser): Promise<HousingRequestDto[]> {
    await this.auth.requireAdmin(user);
    const rows = await this.repository.listHousingRequests();
    return rows.map(mapHousingRequest);
  }

  async updateHousingRequestStatus(
    user: AuthUser,
    requestId: string,
    request: UpdateHousingRequestStatusDto,
  ): Promise<HousingRequestDto> {
    await this.auth.requireAdmin(user);

    const updated = await this.repository.updateHousingRequestStatus(
      requestId,
      request.status,
    );
    if (!updated) {
      throw new NotFoundError('Housing request not found');
    }

    await this.repository.writeAuditLog({
      actorId: user.id,
      action: 'housing_request.status_updated',
      entityType: 'housing_request',
      entityId: updated.id,
      metadata: { status: updated.status },
    });

    return mapHousingRequest({
      id: updated.id,
      email: updated.email,
      desiredArea: updated.desired_area,
      checkIn: updated.check_in,
      checkOut: updated.check_out,
      budgetMax: updated.budget_max,
      accommodationType: updated.accommodation_type,
      notes: updated.notes,
      status: updated.status,
      createdAt: updated.created_at,
    });
  }

  async listAuditLogs(user: AuthUser): Promise<AuditLogDto[]> {
    await this.auth.requireAdmin(user);
    const rows = await this.repository.listAuditLogs();
    return rows.map(mapAuditLog);
  }
}
