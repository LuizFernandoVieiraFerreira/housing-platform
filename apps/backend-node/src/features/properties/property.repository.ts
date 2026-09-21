import { Injectable } from '@nestjs/common';
import type {
  amenities,
  properties,
  property_images,
  rooms,
} from '@prisma/client';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';
import type { CreateRoomRequest } from './dto/create-room-request';
import type { HostPropertyRequest } from './dto/host-property-request';
import {
  normalizeTags,
  requestToPropertyFields,
  roomTypeOrNull,
} from './mappers/property.mapper';
import type {
  PropertySearchCriteria,
  SearchPropertyRow,
} from './property-search.criteria';
import { executePropertySearch } from './property-search.query';

export interface Coordinates {
  latitude: number;
  longitude: number;
}

@Injectable()
export class PropertyRepository {
  constructor(private readonly prisma: PrismaService) {}

  async search(
    criteria: PropertySearchCriteria,
    limit: number,
    offset: number,
  ): Promise<SearchPropertyRow[]> {
    return executePropertySearch(this.prisma, criteria, limit, offset);
  }

  async getPublishedProperty(
    propertyId: string,
  ): Promise<
    (properties & { property_images: property_images[]; rooms: rooms[] }) | null
  > {
    return this.prisma.properties.findFirst({
      where: {
        id: propertyId,
        status: 'published',
        deleted_at: null,
      },
      include: {
        property_images: true,
        rooms: true,
      },
    });
  }

  async getHostProperty(
    propertyId: string,
  ): Promise<(properties & { rooms: rooms[] }) | null> {
    return this.prisma.properties.findFirst({
      where: {
        id: propertyId,
        deleted_at: null,
      },
      include: {
        rooms: true,
      },
    });
  }

  async getPropertyAmenities(propertyId: string): Promise<amenities[]> {
    const rows = await this.prisma.property_amenities.findMany({
      where: { property_id: propertyId },
      include: { amenities: true },
    });

    return rows
      .map((row) => row.amenities)
      .sort((a, b) => a.sort_order - b.sort_order);
  }

  async getPropertyAmenityIds(propertyId: string): Promise<string[]> {
    const rows = await this.prisma.property_amenities.findMany({
      where: { property_id: propertyId },
      select: { amenity_id: true },
    });
    return rows.map((row) => row.amenity_id);
  }

  async findAllAmenities(): Promise<amenities[]> {
    return this.prisma.amenities.findMany({
      orderBy: { sort_order: 'asc' },
    });
  }

  async getPublishedCoordinates(
    propertyId: string,
  ): Promise<Coordinates | null> {
    return this.findCoordinates(propertyId, true);
  }

  async getCoordinates(propertyId: string): Promise<Coordinates | null> {
    return this.findCoordinates(propertyId, false);
  }

  private async findCoordinates(
    propertyId: string,
    publishedOnly: boolean,
  ): Promise<Coordinates | null> {
    const statusClause = publishedOnly
      ? Prisma.sql`AND p.status = 'published'`
      : Prisma.empty;

    const rows = await this.prisma.$queryRaw<
      { latitude: number; longitude: number }[]
    >`
      SELECT
        extensions.st_y(p.location::extensions.geometry) AS latitude,
        extensions.st_x(p.location::extensions.geometry) AS longitude
      FROM public.properties p
      WHERE p.id = ${propertyId}::uuid
        AND p.deleted_at IS NULL
        AND p.location IS NOT NULL
        ${statusClause}
    `;

    const row = rows[0];
    if (!row) {
      return null;
    }

    return {
      latitude: Number(row.latitude),
      longitude: Number(row.longitude),
    };
  }

  async createProperty(
    hostId: string,
    slug: string,
    request: HostPropertyRequest,
  ): Promise<properties> {
    const fields = requestToPropertyFields(request);
    const tags = normalizeTags(request.tags);

    return this.prisma.properties.create({
      data: {
        host_id: hostId,
        slug,
        status: 'draft',
        country: 'KR',
        tags,
        ...fields,
      },
    });
  }

  async updateProperty(
    propertyId: string,
    request: HostPropertyRequest,
  ): Promise<properties | null> {
    const existing = await this.getHostProperty(propertyId);
    if (!existing) {
      return null;
    }

    const fields = requestToPropertyFields(request);
    const tags = normalizeTags(request.tags);

    return this.prisma.properties.update({
      where: { id: propertyId },
      data: {
        ...fields,
        tags,
        updated_at: new Date(),
      },
    });
  }

  async setLocation(
    propertyId: string,
    latitude: number,
    longitude: number,
  ): Promise<boolean> {
    const rows = await this.prisma.$queryRaw<{ id: string }[]>`
      UPDATE public.properties
      SET location = extensions.st_setsrid(
        extensions.st_makepoint(${longitude}, ${latitude}),
        4326
      )::extensions.geography
      WHERE id = ${propertyId}::uuid
        AND deleted_at IS NULL
        AND status IN ('draft', 'pending_review')
      RETURNING id
    `;

    return rows.length > 0;
  }

  async countAvailableRooms(propertyId: string): Promise<number> {
    return this.prisma.rooms.count({
      where: {
        property_id: propertyId,
        deleted_at: null,
        status: 'available',
      },
    });
  }

  async hasLocation(propertyId: string): Promise<boolean> {
    const rows = await this.prisma.$queryRaw<{ exists: boolean }[]>`
      SELECT EXISTS (
        SELECT 1
        FROM public.properties
        WHERE id = ${propertyId}::uuid
          AND location IS NOT NULL
      ) AS exists
    `;
    return rows[0]?.exists ?? false;
  }

  async submitForReview(propertyId: string): Promise<properties | null> {
    const rows = await this.prisma.$queryRaw<{ id: string }[]>`
      UPDATE public.properties
      SET status = 'pending_review'
      WHERE id = ${propertyId}::uuid
        AND deleted_at IS NULL
        AND status = 'draft'
      RETURNING id
    `;

    if (rows.length === 0) {
      return null;
    }

    return this.getHostProperty(propertyId);
  }

  async syncAmenities(
    propertyId: string,
    amenityIds: string[],
  ): Promise<void> {
    await this.prisma.property_amenities.deleteMany({
      where: { property_id: propertyId },
    });

    if (amenityIds.length === 0) {
      return;
    }

    await this.prisma.property_amenities.createMany({
      data: amenityIds.map((amenityId) => ({
        property_id: propertyId,
        amenity_id: amenityId,
      })),
    });
  }

  async getHostDisplayName(hostId: string): Promise<string> {
    const host = await this.prisma.hosts.findFirst({
      where: {
        id: hostId,
        deleted_at: null,
      },
      select: { display_name: true },
    });

    return host?.display_name?.trim() || 'Host';
  }

  async createRoom(
    propertyId: string,
    request: CreateRoomRequest,
  ): Promise<rooms> {
    return this.prisma.rooms.create({
      data: {
        property_id: propertyId,
        name: request.name,
        room_type: roomTypeOrNull(request),
        size_sqm: request.sizeSqm ?? null,
        max_occupancy: request.maxOccupancy,
        monthly_price_krw: request.monthlyPriceKrw,
        status: 'available',
        available_from: request.availableFrom
          ? new Date(`${request.availableFrom}T00:00:00.000Z`)
          : null,
      },
    });
  }

  async findRoomPropertyId(roomId: string): Promise<string | null> {
    const room = await this.prisma.rooms.findUnique({
      where: { id: roomId },
      select: { property_id: true },
    });
    return room?.property_id ?? null;
  }

  async deleteRoom(roomId: string): Promise<boolean> {
    try {
      await this.prisma.rooms.delete({
        where: { id: roomId },
      });
      return true;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        return false;
      }
      throw error;
    }
  }
}
