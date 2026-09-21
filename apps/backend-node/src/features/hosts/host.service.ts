import { Injectable } from '@nestjs/common';

import type { AuthUser } from '../../shared/auth/auth-user.model';
import { AuthorizationService } from '../../shared/auth/authorization.service';
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from '../../shared/errors';
import type { HostPropertyDetail } from '../properties/dto/host-property-detail';
import { mapHostPropertyDetail } from '../properties/mappers/property.mapper';
import { PropertyRepository } from '../properties/property.repository';
import type {
  HostBookingDto,
  HostDto,
  HostPropertyListItemDto,
  RegisterHostRequestDto,
} from './dto';
import {
  mapHost,
  mapHostBooking,
  mapHostPropertyListItem,
} from './mappers/host.mapper';
import { HostRepository } from './host.repository';

@Injectable()
export class HostService {
  constructor(
    private readonly repository: HostRepository,
    private readonly propertyRepository: PropertyRepository,
    private readonly auth: AuthorizationService,
  ) {}

  async register(user: AuthUser, request: RegisterHostRequestDto): Promise<HostDto> {
    const displayName = request.displayName.trim();
    if (!displayName) {
      throw new BadRequestError('Display name is required');
    }

    const host = await this.repository.register(user.id, displayName);
    return mapHost(host);
  }

  async getCurrentHost(user: AuthUser): Promise<HostDto | null> {
    const host = await this.repository.getByProfileId(user.id);
    if (!host) {
      return null;
    }

    return mapHost(host);
  }

  async listProperties(user: AuthUser): Promise<HostPropertyListItemDto[]> {
    const hostId = await this.requireHostId(user);
    const rows = await this.repository.listProperties(hostId);
    return rows.map(mapHostPropertyListItem);
  }

  async getProperty(
    user: AuthUser,
    propertyId: string,
  ): Promise<HostPropertyDetail> {
    const hostId = await this.requireHostId(user);

    if (!(await this.repository.propertyBelongsToHost(hostId, propertyId))) {
      throw new NotFoundError('Property not found');
    }

    const propertyRow = await this.propertyRepository.getHostProperty(propertyId);
    if (!propertyRow) {
      throw new NotFoundError('Property not found');
    }

    const coordinates = await this.propertyRepository.getCoordinates(propertyId);
    const amenityIds =
      await this.propertyRepository.getPropertyAmenityIds(propertyId);

    return mapHostPropertyDetail(propertyRow, {
      latitude: coordinates?.latitude ?? null,
      longitude: coordinates?.longitude ?? null,
      amenityIds,
    });
  }

  async listBookings(user: AuthUser): Promise<HostBookingDto[]> {
    const hostId = await this.requireHostId(user);
    const rows = await this.repository.listBookings(hostId);
    return rows.map(mapHostBooking);
  }

  private async requireHostId(user: AuthUser): Promise<string> {
    const hostId = await this.auth.getHostIdForProfile(user.id);
    if (!hostId) {
      throw new ForbiddenError('Host profile is required');
    }

    return hostId;
  }
}
