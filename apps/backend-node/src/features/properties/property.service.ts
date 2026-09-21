import { Injectable } from '@nestjs/common';
import type { properties } from '@prisma/client';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';
import type { AuthUser } from '../../shared/auth/auth-user.model';
import { AuthorizationService } from '../../shared/auth/authorization.service';
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from '../../shared/errors';
import { StorageUrlResolver } from '../../shared/storage/storage-url.resolver';
import type { CreateRoomRequest } from './dto/create-room-request';
import type { CreatedId } from './dto/created-id';
import type { HostPropertyDetail } from './dto/host-property-detail';
import type { HostPropertyRequest } from './dto/host-property-request';
import type { HostRoomDto } from './dto/host-room';
import type { PropertyAmenityDto } from './dto/property-amenity';
import type { PropertyDetail } from './dto/property-detail';
import type { PropertyStatusChange } from './dto/property-status-change';
import type { SetPropertyLocationRequest } from './dto/set-property-location-request';
import {
  createPropertySlug,
  mapAmenityDto,
  mapHostPropertyDetail,
  mapHostRoom,
  mapPropertyDetail,
  normalizeTags,
  propertyStatusToApi,
  requestToPropertyFields,
} from './mappers/property.mapper';
import { PropertyRepository } from './property.repository';

@Injectable()
export class PropertyService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly repository: PropertyRepository,
    private readonly auth: AuthorizationService,
    private readonly storage: StorageUrlResolver,
  ) {}

  async getPublishedProperty(propertyId: string): Promise<PropertyDetail> {
    const propertyRow = await this.repository.getPublishedProperty(propertyId);
    if (!propertyRow || propertyRow.monthly_price_min == null) {
      throw new NotFoundError('Property not found');
    }

    const coordinates =
      await this.repository.getPublishedCoordinates(propertyId);
    const amenities = await this.repository.getPropertyAmenities(propertyId);
    const hostDisplayName = await this.repository.getHostDisplayName(
      propertyRow.host_id,
    );

    return mapPropertyDetail(propertyRow, {
      hostDisplayName,
      latitude: coordinates?.latitude ?? null,
      longitude: coordinates?.longitude ?? null,
      amenities,
      storage: this.storage,
    });
  }

  async createProperty(
    user: AuthUser,
    request: HostPropertyRequest,
  ): Promise<CreatedId> {
    const hostId = await this.requireHostId(user);
    const slug = createPropertySlug(request.title);
    const amenityIds = request.amenityIds ?? [];

    const propertyId = await this.prisma.$transaction(async (tx) => {
      const propertyRow = await tx.properties.create({
        data: {
          host_id: hostId,
          slug,
          status: 'draft',
          country: 'KR',
          tags: normalizeTags(request.tags),
          ...requestToPropertyFields(request),
        },
      });

      await this.applyLocationIfPresentTx(tx, propertyRow.id, request);
      await this.syncAmenitiesTx(tx, propertyRow.id, amenityIds);
      return propertyRow.id;
    });

    return { id: propertyId };
  }

  async updateProperty(
    user: AuthUser,
    propertyId: string,
    request: HostPropertyRequest,
  ): Promise<HostPropertyDetail> {
    await this.requireMutableProperty(user, propertyId);
    const amenityIds = request.amenityIds ?? [];

    await this.prisma.$transaction(async (tx) => {
      const existing = await tx.properties.findFirst({
        where: {
          id: propertyId,
          deleted_at: null,
        },
      });

      if (!existing) {
        throw new NotFoundError('Property not found');
      }

      await tx.properties.update({
        where: { id: propertyId },
        data: {
          ...requestToPropertyFields(request),
          tags: normalizeTags(request.tags),
          updated_at: new Date(),
        },
      });

      await this.applyLocationIfPresentTx(tx, propertyId, request);
      await this.syncAmenitiesTx(tx, propertyId, amenityIds);
    });

    return this.loadHostPropertyDetail(propertyId);
  }

  async setLocation(
    user: AuthUser,
    propertyId: string,
    request: SetPropertyLocationRequest,
  ): Promise<void> {
    await this.requireMutableProperty(user, propertyId);

    const updated = await this.repository.setLocation(
      propertyId,
      request.latitude,
      request.longitude,
    );

    if (!updated) {
      throw new BadRequestError('Property location cannot be updated');
    }
  }

  async submitForReview(
    user: AuthUser,
    propertyId: string,
  ): Promise<PropertyStatusChange> {
    await this.auth.requireHostOfProperty(user, propertyId);

    const propertyRow = await this.repository.getHostProperty(propertyId);
    if (!propertyRow) {
      throw new NotFoundError('Property not found');
    }

    if (propertyRow.status !== 'draft') {
      throw new BadRequestError(
        'Property must be in draft status to submit for review',
      );
    }

    if ((await this.repository.countAvailableRooms(propertyId)) === 0) {
      throw new BadRequestError(
        'Add at least one available room before submitting',
      );
    }

    if (!(await this.repository.hasLocation(propertyId))) {
      throw new BadRequestError(
        'Geocode the property address before submitting',
      );
    }

    const updated = await this.repository.submitForReview(propertyId);
    if (!updated) {
      throw new BadRequestError(
        'Property must be in draft status to submit for review',
      );
    }

    return {
      id: updated.id,
      status: propertyStatusToApi(updated.status),
    };
  }

  async createRoom(
    user: AuthUser,
    propertyId: string,
    request: CreateRoomRequest,
  ): Promise<HostRoomDto> {
    await this.requireMutableProperty(user, propertyId);
    const room = await this.repository.createRoom(propertyId, request);
    return mapHostRoom(room);
  }

  async deleteRoom(user: AuthUser, roomId: string): Promise<void> {
    const propertyId = await this.repository.findRoomPropertyId(roomId);
    if (!propertyId) {
      throw new NotFoundError('Room not found');
    }

    if (
      !(await this.auth.isHostOfProperty(user.id, propertyId)) &&
      !(await this.auth.isAdmin(user.id))
    ) {
      throw new ForbiddenError(
        'Only the host of this property can perform this action',
      );
    }

    const deleted = await this.repository.deleteRoom(roomId);
    if (!deleted) {
      throw new NotFoundError('Room not found');
    }
  }

  async listAmenities(): Promise<PropertyAmenityDto[]> {
    const amenities = await this.repository.findAllAmenities();
    return amenities.map(mapAmenityDto);
  }

  private async loadHostPropertyDetail(
    propertyId: string,
  ): Promise<HostPropertyDetail> {
    const propertyRow = await this.repository.getHostProperty(propertyId);
    if (!propertyRow) {
      throw new NotFoundError('Property not found');
    }

    const coordinates = await this.repository.getCoordinates(propertyId);
    const amenityIds = await this.repository.getPropertyAmenityIds(propertyId);

    return mapHostPropertyDetail(propertyRow, {
      latitude: coordinates?.latitude ?? null,
      longitude: coordinates?.longitude ?? null,
      amenityIds,
    });
  }

  private async requireHostId(user: AuthUser): Promise<string> {
    const hostId = await this.auth.getHostIdForProfile(user.id);
    if (!hostId) {
      throw new ForbiddenError(
        'Host profile is required before creating listings',
      );
    }
    return hostId;
  }

  private async requireMutableProperty(
    user: AuthUser,
    propertyId: string,
  ): Promise<properties> {
    const propertyRow = await this.repository.getHostProperty(propertyId);
    if (!propertyRow) {
      throw new NotFoundError('Property not found');
    }

    if (await this.auth.isAdmin(user.id)) {
      return propertyRow;
    }

    if (!(await this.auth.isHostOfProperty(user.id, propertyId))) {
      throw new ForbiddenError(
        'Only the host of this property can perform this action',
      );
    }

    if (
      propertyRow.status !== 'draft' &&
      propertyRow.status !== 'pending_review'
    ) {
      throw new BadRequestError(
        'Property can only be updated while draft or pending review',
      );
    }

    return propertyRow;
  }

  private async applyLocationIfPresentTx(
    tx: Prisma.TransactionClient,
    propertyId: string,
    request: HostPropertyRequest,
  ): Promise<void> {
    if (request.latitude == null || request.longitude == null) {
      return;
    }

    const rows = await tx.$queryRaw<{ id: string }[]>`
      UPDATE public.properties
      SET location = extensions.st_setsrid(
        extensions.st_makepoint(${request.longitude}, ${request.latitude}),
        4326
      )::extensions.geography
      WHERE id = ${propertyId}::uuid
        AND deleted_at IS NULL
        AND status IN ('draft', 'pending_review')
      RETURNING id
    `;

    if (rows.length === 0) {
      throw new BadRequestError('Property location cannot be updated');
    }
  }

  private async syncAmenitiesTx(
    tx: Prisma.TransactionClient,
    propertyId: string,
    amenityIds: string[],
  ): Promise<void> {
    await tx.property_amenities.deleteMany({
      where: { property_id: propertyId },
    });

    if (amenityIds.length === 0) {
      return;
    }

    await tx.property_amenities.createMany({
      data: amenityIds.map((amenityId) => ({
        property_id: propertyId,
        amenity_id: amenityId,
      })),
    });
  }
}
