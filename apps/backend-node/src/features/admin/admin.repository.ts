import { Injectable } from '@nestjs/common';
import type { audit_logs, hosts, housing_requests, properties } from '@prisma/client';
import type { housing_request_status } from '@prisma/client';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';

export interface AdminPropertyRow {
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
  hostDisplayName: string;
}

export interface AdminHostRow {
  id: string;
  displayName: string;
  status: string;
  profileName: string;
  verifiedAt: Date | null;
  createdAt: Date;
}

export interface AdminBookingRow {
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

export interface AdminPaymentRow {
  id: string;
  orderId: string;
  bookingId: string;
  amountKrw: number;
  status: string;
  propertyTitle: string | null;
  customerName: string | null;
  confirmedAt: Date | null;
  createdAt: Date;
}

export interface HousingRequestRow {
  id: string;
  email: string;
  desiredArea: string;
  checkIn: Date | null;
  checkOut: Date | null;
  budgetMax: number | null;
  accommodationType: string | null;
  notes: string | null;
  status: string;
  createdAt: Date;
}

export interface AuditLogRow {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  actorName: string;
  metadata: Record<string, unknown>;
  createdAt: Date;
}

@Injectable()
export class AdminRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboardStats(): Promise<{
    pendingProperties: number;
    pendingHosts: number;
    openBookings: number;
    openHousingRequests: number;
  }> {
    const [
      pendingProperties,
      pendingHosts,
      openBookings,
      openHousingRequests,
    ] = await Promise.all([
      this.prisma.properties.count({
        where: {
          status: 'pending_review',
          deleted_at: null,
        },
      }),
      this.prisma.hosts.count({
        where: {
          status: 'pending',
          deleted_at: null,
        },
      }),
      this.prisma.bookings.count({
        where: {
          status: {
            in: ['requested', 'pending_payment', 'payment_failed'],
          },
        },
      }),
      this.prisma.housing_requests.count({
        where: {
          status: {
            in: ['new', 'in_progress'],
          },
        },
      }),
    ]);

    return {
      pendingProperties,
      pendingHosts,
      openBookings,
      openHousingRequests,
    };
  }

  async listProperties(): Promise<AdminPropertyRow[]> {
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
        host_display_name: string;
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
        p.updated_at,
        h.display_name AS host_display_name
      FROM public.properties p
      JOIN public.hosts h ON h.id = p.host_id
      WHERE p.deleted_at IS NULL
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
      hostDisplayName: row.host_display_name,
    }));
  }

  async publishProperty(propertyId: string): Promise<properties | null> {
    const rows = await this.prisma.$queryRaw<{ id: string }[]>`
      UPDATE public.properties
      SET
        status = 'published',
        published_at = timezone('utc', now())
      WHERE id = ${propertyId}::uuid
        AND deleted_at IS NULL
        AND status = 'pending_review'
      RETURNING id
    `;

    if (rows.length === 0) {
      return null;
    }

    return this.prisma.properties.findUnique({
      where: { id: propertyId },
    });
  }

  async rejectPropertyReview(propertyId: string): Promise<properties | null> {
    const rows = await this.prisma.$queryRaw<{ id: string }[]>`
      UPDATE public.properties
      SET status = 'draft'
      WHERE id = ${propertyId}::uuid
        AND deleted_at IS NULL
        AND status = 'pending_review'
      RETURNING id
    `;

    if (rows.length === 0) {
      return null;
    }

    return this.prisma.properties.findUnique({
      where: { id: propertyId },
    });
  }

  async listHosts(): Promise<AdminHostRow[]> {
    const rows = await this.prisma.$queryRaw<
      {
        id: string;
        display_name: string;
        status: string;
        profile_name: string;
        verified_at: Date | null;
        created_at: Date;
      }[]
    >`
      SELECT
        h.id,
        h.display_name,
        h.status::text AS status,
        p.full_name AS profile_name,
        h.verified_at,
        h.created_at
      FROM public.hosts h
      JOIN public.profiles p ON p.id = h.profile_id
      WHERE h.deleted_at IS NULL
      ORDER BY h.created_at DESC
    `;

    return rows.map((row) => ({
      id: row.id,
      displayName: row.display_name,
      status: row.status,
      profileName: row.profile_name,
      verifiedAt: row.verified_at,
      createdAt: row.created_at,
    }));
  }

  async approveHost(hostId: string): Promise<hosts | null> {
    const rows = await this.prisma.$queryRaw<{ id: string }[]>`
      UPDATE public.hosts
      SET
        status = 'active',
        verified_at = timezone('utc', now())
      WHERE id = ${hostId}::uuid
        AND deleted_at IS NULL
        AND status = 'pending'
      RETURNING id
    `;

    if (rows.length === 0) {
      return null;
    }

    return this.prisma.hosts.findUnique({
      where: { id: hostId },
    });
  }

  async listBookings(): Promise<AdminBookingRow[]> {
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

  async listPayments(): Promise<AdminPaymentRow[]> {
    const rows = await this.prisma.$queryRaw<
      {
        id: string;
        order_id: string;
        booking_id: string;
        amount_krw: number;
        status: string;
        property_title: string | null;
        customer_name: string | null;
        confirmed_at: Date | null;
        created_at: Date;
      }[]
    >`
      SELECT
        pay.id,
        pay.order_id,
        pay.booking_id,
        pay.amount_krw,
        pay.status::text AS status,
        pay.confirmed_at,
        pay.created_at,
        prop.title AS property_title,
        prof.full_name AS customer_name
      FROM public.payments pay
      JOIN public.bookings b ON b.id = pay.booking_id
      JOIN public.properties prop ON prop.id = b.property_id
      JOIN public.profiles prof ON prof.id = pay.customer_id
      ORDER BY pay.created_at DESC
    `;

    return rows.map((row) => ({
      id: row.id,
      orderId: row.order_id,
      bookingId: row.booking_id,
      amountKrw: row.amount_krw,
      status: row.status,
      propertyTitle: row.property_title,
      customerName: row.customer_name,
      confirmedAt: row.confirmed_at,
      createdAt: row.created_at,
    }));
  }

  async listHousingRequests(): Promise<HousingRequestRow[]> {
    const rows = await this.prisma.$queryRaw<
      {
        id: string;
        email: string;
        desired_area: string;
        check_in: Date | null;
        check_out: Date | null;
        budget_max: number | null;
        accommodation_type: string | null;
        notes: string | null;
        status: string;
        created_at: Date;
      }[]
    >`
      SELECT
        id,
        email,
        desired_area,
        check_in,
        check_out,
        budget_max,
        accommodation_type::text AS accommodation_type,
        notes,
        status::text AS status,
        created_at
      FROM public.housing_requests
      ORDER BY created_at DESC
    `;

    return rows.map((row) => ({
      id: row.id,
      email: row.email,
      desiredArea: row.desired_area,
      checkIn: row.check_in,
      checkOut: row.check_out,
      budgetMax: row.budget_max,
      accommodationType: row.accommodation_type,
      notes: row.notes,
      status: row.status,
      createdAt: row.created_at,
    }));
  }

  async updateHousingRequestStatus(
    requestId: string,
    status: housing_request_status,
  ): Promise<housing_requests | null> {
    try {
      return await this.prisma.housing_requests.update({
        where: { id: requestId },
        data: { status },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        return null;
      }
      throw error;
    }
  }

  async listAuditLogs(limit = 100): Promise<AuditLogRow[]> {
    const rows = await this.prisma.$queryRaw<
      {
        id: string;
        action: string;
        entity_type: string;
        entity_id: string | null;
        metadata: Record<string, unknown> | null;
        created_at: Date;
        actor_name: string;
      }[]
    >`
      SELECT
        a.id,
        a.action,
        a.entity_type,
        a.entity_id,
        a.metadata,
        a.created_at,
        p.full_name AS actor_name
      FROM public.audit_logs a
      JOIN public.profiles p ON p.id = a.actor_id
      ORDER BY a.created_at DESC
      LIMIT ${limit}
    `;

    return rows.map((row) => ({
      id: row.id,
      action: row.action,
      entityType: row.entity_type,
      entityId: row.entity_id,
      actorName: row.actor_name,
      metadata: row.metadata ?? {},
      createdAt: row.created_at,
    }));
  }

  async writeAuditLog(options: {
    actorId: string;
    action: string;
    entityType: string;
    entityId?: string | null;
    metadata?: Record<string, unknown>;
  }): Promise<audit_logs> {
    return this.prisma.audit_logs.create({
      data: {
        actor_id: options.actorId,
        action: options.action.trim(),
        entity_type: options.entityType.trim(),
        entity_id: options.entityId ?? null,
        metadata: (options.metadata ?? {}) as Prisma.InputJsonValue,
      },
    });
  }
}
