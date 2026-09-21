import { Injectable } from '@nestjs/common';
import type { hosts } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';

export interface HostPropertyListRow {
  id: string;
  title: string;
  slug: string;
  propertyType: string;
  district: string;
  status: string;
  bookingMode: string;
  monthlyPriceMin: number | null;
  roomCount: number;
  updatedAt: Date;
}

export interface HostBookingRow {
  id: string;
  status: string;
  bookingType: string;
  checkIn: Date;
  checkOut: Date;
  guestCount: number;
  customerNotes: string | null;
  propertyTitle: string;
  roomName: string;
  totalKrw: number;
  createdAt: Date;
}

@Injectable()
export class HostRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getByProfileId(profileId: string): Promise<hosts | null> {
    return this.prisma.hosts.findFirst({
      where: {
        profile_id: profileId,
        deleted_at: null,
      },
    });
  }

  async register(profileId: string, displayName: string): Promise<hosts> {
    const existing = await this.getByProfileId(profileId);
    if (existing) {
      return existing;
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.$executeRaw`
        ALTER TABLE public.profiles DISABLE TRIGGER profiles_protect_role
      `;

      try {
        await tx.$executeRaw`
          UPDATE public.profiles
          SET role = 'host'
          WHERE id = ${profileId}::uuid
        `;

        return tx.hosts.create({
          data: {
            profile_id: profileId,
            display_name: displayName.trim(),
            status: 'pending',
          },
        });
      } finally {
        await tx.$executeRaw`
          ALTER TABLE public.profiles ENABLE TRIGGER profiles_protect_role
        `;
      }
    });
  }

  async listProperties(hostId: string): Promise<HostPropertyListRow[]> {
    const rows = await this.prisma.$queryRaw<
      {
        id: string;
        title: string;
        slug: string;
        property_type: string;
        district: string;
        status: string;
        booking_mode: string;
        monthly_price_min: number | null;
        room_count: number;
        updated_at: Date;
      }[]
    >`
      SELECT
        p.id,
        p.title,
        p.slug,
        p.property_type::text AS property_type,
        p.district,
        p.status::text AS status,
        p.booking_mode::text AS booking_mode,
        p.monthly_price_min,
        COALESCE(
          (
            SELECT COUNT(*)::integer
            FROM public.rooms r
            WHERE r.property_id = p.id
              AND r.deleted_at IS NULL
          ),
          0
        ) AS room_count,
        p.updated_at
      FROM public.properties p
      WHERE p.host_id = ${hostId}::uuid
        AND p.deleted_at IS NULL
      ORDER BY p.updated_at DESC
    `;

    return rows.map((row) => ({
      id: row.id,
      title: row.title,
      slug: row.slug,
      propertyType: row.property_type,
      district: row.district,
      status: row.status,
      bookingMode: row.booking_mode,
      monthlyPriceMin: row.monthly_price_min,
      roomCount: row.room_count,
      updatedAt: row.updated_at,
    }));
  }

  async propertyBelongsToHost(
    hostId: string,
    propertyId: string,
  ): Promise<boolean> {
    const count = await this.prisma.properties.count({
      where: {
        id: propertyId,
        host_id: hostId,
        deleted_at: null,
      },
    });

    return count > 0;
  }

  async listBookings(hostId: string): Promise<HostBookingRow[]> {
    const rows = await this.prisma.$queryRaw<
      {
        id: string;
        status: string;
        booking_type: string;
        check_in: Date;
        check_out: Date;
        guest_count: number;
        customer_notes: string | null;
        property_title: string;
        room_name: string;
        total_krw: number;
        created_at: Date;
      }[]
    >`
      SELECT
        b.id,
        b.status::text AS status,
        b.booking_type::text AS booking_type,
        b.check_in,
        b.check_out,
        b.guest_count,
        b.customer_notes,
        p.title AS property_title,
        r.name AS room_name,
        s.total_krw,
        b.created_at
      FROM public.bookings b
      JOIN public.properties p ON p.id = b.property_id
      JOIN public.rooms r ON r.id = b.room_id
      JOIN public.booking_price_snapshots s ON s.booking_id = b.id
      WHERE p.host_id = ${hostId}::uuid
      ORDER BY b.created_at DESC
    `;

    return rows.map((row) => ({
      id: row.id,
      status: row.status,
      bookingType: row.booking_type,
      checkIn: row.check_in,
      checkOut: row.check_out,
      guestCount: row.guest_count,
      customerNotes: row.customer_notes,
      propertyTitle: row.property_title,
      roomName: row.room_name,
      totalKrw: row.total_krw,
      createdAt: row.created_at,
    }));
  }

  async getProfileFullName(profileId: string): Promise<string | null> {
    const profile = await this.prisma.profiles.findFirst({
      where: {
        id: profileId,
        deleted_at: null,
      },
      select: { full_name: true },
    });

    return profile?.full_name ?? null;
  }
}
