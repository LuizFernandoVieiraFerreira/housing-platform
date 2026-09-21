import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';

import type { AuthUser } from '../../shared/auth/auth-user.model';
import { RequireUser } from '../../shared/auth/require-user.decorator';
import type { HostBookingDto } from '../hosts/dto/host-booking.dto';
import type { HostDto } from '../hosts/dto/host.dto';
import type { PropertyStatusChange } from '../properties/dto/property-status-change';
import { AdminService } from './admin.service';
import type {
  AdminDashboardStatsDto,
  AdminHostDto,
  AdminPaymentDto,
  AdminPropertyDto,
  AuditLogDto,
  HousingRequestDto,
  UpdateHousingRequestStatusDto,
} from './dto';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('stats')
  getAdminStats(
    @RequireUser() user: AuthUser,
  ): Promise<AdminDashboardStatsDto> {
    return this.adminService.getDashboardStats(user);
  }

  @Get('properties')
  listAdminProperties(
    @RequireUser() user: AuthUser,
  ): Promise<AdminPropertyDto[]> {
    return this.adminService.listProperties(user);
  }

  @Post('properties/:propertyId/publish')
  publishProperty(
    @RequireUser() user: AuthUser,
    @Param('propertyId', ParseUUIDPipe) propertyId: string,
  ): Promise<PropertyStatusChange> {
    return this.adminService.publishProperty(user, propertyId);
  }

  @Post('properties/:propertyId/reject')
  rejectPropertyReview(
    @RequireUser() user: AuthUser,
    @Param('propertyId', ParseUUIDPipe) propertyId: string,
  ): Promise<PropertyStatusChange> {
    return this.adminService.rejectPropertyReview(user, propertyId);
  }

  @Get('hosts')
  listAdminHosts(@RequireUser() user: AuthUser): Promise<AdminHostDto[]> {
    return this.adminService.listHosts(user);
  }

  @Post('hosts/:hostId/approve')
  approveHost(
    @RequireUser() user: AuthUser,
    @Param('hostId', ParseUUIDPipe) hostId: string,
  ): Promise<HostDto> {
    return this.adminService.approveHost(user, hostId);
  }

  @Get('bookings')
  listAdminBookings(
    @RequireUser() user: AuthUser,
  ): Promise<HostBookingDto[]> {
    return this.adminService.listBookings(user);
  }

  @Get('payments')
  listAdminPayments(
    @RequireUser() user: AuthUser,
  ): Promise<AdminPaymentDto[]> {
    return this.adminService.listPayments(user);
  }

  @Get('housing-requests')
  listHousingRequests(
    @RequireUser() user: AuthUser,
  ): Promise<HousingRequestDto[]> {
    return this.adminService.listHousingRequests(user);
  }

  @Patch('housing-requests/:requestId')
  updateHousingRequestStatus(
    @RequireUser() user: AuthUser,
    @Param('requestId', ParseUUIDPipe) requestId: string,
    @Body() request: UpdateHousingRequestStatusDto,
  ): Promise<HousingRequestDto> {
    return this.adminService.updateHousingRequestStatus(user, requestId, request);
  }

  @Get('audit-logs')
  listAuditLogs(@RequireUser() user: AuthUser): Promise<AuditLogDto[]> {
    return this.adminService.listAuditLogs(user);
  }
}
