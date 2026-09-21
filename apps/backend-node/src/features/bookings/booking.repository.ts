import { Injectable } from '@nestjs/common';
import {
  booking_mode,
  booking_status,
  booking_type,
  type bookings,
  Prisma,
  property_status,
  room_status,
} from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';
import {
  BadRequestError,
  ConflictError,
  NotFoundError,
} from '../../shared/errors';
import type { BookingPrice } from './booking-pricing.service';
import { rethrowBookingOverlap } from './booking-overlap.util';

type TransactionClient = Prisma.TransactionClient;

export interface BookingInputs {
  roomId: string;
  propertyId: string;
  bookingMode: string;
  minStayNights: number;
  monthlyPriceKrw: number;
  maxOccupancy: number;
  nights: number;
}

export interface BookingListRow {
  id: string;
  customerId: string;
  status: string;
  bookingType: string;
  checkIn: Date;
  checkOut: Date;
  guestCount: number;
  holdExpiresAt: Date | null;
  createdAt: Date;
  customerNotes: string | null;
  propertyId: string;
  roomId: string;
  propertyTitle: string;
  district: string;
  roomName: string;
  rentKrw: number;
  serviceFeeKrw: number;
  totalKrw: number;
  pricingVersion: string;
}

interface BookingListRowRecord {
  id: string;
  customer_id: string;
  status: string;
  booking_type: string;
  check_in: Date;
  check_out: Date;
  guest_count: number;
  hold_expires_at: Date | null;
  created_at: Date;
  customer_notes: string | null;
  property_id: string;
  room_id: string;
  property_title: string;
  district: string;
  room_name: string;
  rent_krw: number;
  service_fee_krw: number;
  total_krw: number;
  pricing_version: string;
}

const BOOKING_LIST_SQL = `
  select
    b.id,
    b.customer_id,
    b.status::text as status,
    b.booking_type::text as booking_type,
    b.check_in,
    b.check_out,
    b.guest_count,
    b.hold_expires_at,
    b.created_at,
    b.customer_notes,
    b.property_id,
    b.room_id,
    p.title as property_title,
    p.district,
    r.name as room_name,
    s.rent_krw,
    s.service_fee_krw,
    s.total_krw,
    s.pricing_version
  from public.bookings b
  join public.properties p on p.id = b.property_id
  join public.rooms r on r.id = b.room_id
  join public.booking_price_snapshots s on s.booking_id = b.id
`;

@Injectable()
export class BookingRepository {
  constructor(private readonly prisma: PrismaService) {}

  async validateBookingInputs(
    roomId: string,
    checkIn: Date,
    checkOut: Date,
    guestCount: number,
    tx: TransactionClient = this.prisma,
  ): Promise<BookingInputs> {
    if (checkOut <= checkIn) {
      throw new BadRequestError('checkOut must be after checkIn');
    }

    if (guestCount <= 0) {
      throw new BadRequestError('guestCount must be positive');
    }

    const room = await tx.rooms.findFirst({
      where: {
        id: roomId,
        deleted_at: null,
        status: room_status.available,
      },
    });

    if (!room) {
      throw new NotFoundError('Room is not available');
    }

    const propertyRow = await tx.properties.findFirst({
      where: {
        id: room.property_id,
        deleted_at: null,
        status: property_status.published,
      },
    });

    if (!propertyRow) {
      throw new NotFoundError('Property is not published');
    }

    const nights = daysBetween(checkIn, checkOut);

    if (nights < propertyRow.min_stay_nights) {
      throw new BadRequestError(
        `Stay must be at least ${propertyRow.min_stay_nights} nights`,
      );
    }

    if (guestCount > room.max_occupancy) {
      throw new BadRequestError(
        `Room supports up to ${room.max_occupancy} guests`,
      );
    }

    if (
      room.available_from !== null &&
      room.available_from > checkIn
    ) {
      throw new BadRequestError(
        'Room is not available from the selected check-in date',
      );
    }

    return {
      roomId: room.id,
      propertyId: propertyRow.id,
      bookingMode: propertyRow.booking_mode,
      minStayNights: propertyRow.min_stay_nights,
      monthlyPriceKrw: room.monthly_price_krw,
      maxOccupancy: room.max_occupancy,
      nights,
    };
  }

  async roomHasBookingConflict(
    roomId: string,
    checkIn: Date,
    checkOut: Date,
    tx: TransactionClient = this.prisma,
  ): Promise<boolean> {
    const rows = await tx.$queryRaw<{ exists: boolean }[]>`
      select exists (
        select 1
        from public.bookings b
        where b.room_id = ${roomId}::uuid
          and b.status in ('pending_payment', 'confirmed', 'active')
          and daterange(b.check_in, b.check_out, '[)')
              && daterange(${checkIn}::date, ${checkOut}::date, '[)')
      ) as exists
    `;

    return rows[0]?.exists ?? false;
  }

  async getPlatformSettings(tx: TransactionClient = this.prisma) {
    const settings = await tx.platform_settings.findUnique({
      where: { id: 1 },
    });

    if (!settings) {
      throw new BadRequestError('Platform settings are not configured');
    }

    return settings;
  }

  async createBookingHold(
    options: {
      customerId: string;
      roomId: string;
      propertyId: string;
      checkIn: Date;
      checkOut: Date;
      guestCount: number;
      customerNotes: string | null;
      bookingMode: string;
      price: BookingPrice;
      nights: number;
      monthlyPriceKrw: number;
    },
    tx: TransactionClient = this.prisma,
  ): Promise<bookings> {
    const settings = await this.getPlatformSettings(tx);
    const now = new Date();

    let status: booking_status;
    let bookingTypeValue: booking_type;
    let holdExpiresAt: Date | null;

    if (options.bookingMode === booking_mode.instant) {
      status = booking_status.pending_payment;
      bookingTypeValue = booking_type.instant;
      holdExpiresAt = new Date(
        now.getTime() + settings.hold_ttl_minutes * 60_000,
      );
    } else {
      status = booking_status.requested;
      bookingTypeValue = booking_type.request;
      holdExpiresAt = null;
    }

    try {
      const booking = await tx.bookings.create({
        data: {
          customer_id: options.customerId,
          room_id: options.roomId,
          property_id: options.propertyId,
          check_in: options.checkIn,
          check_out: options.checkOut,
          guest_count: options.guestCount,
          status,
          booking_type: bookingTypeValue,
          hold_expires_at: holdExpiresAt,
          customer_notes: options.customerNotes,
        },
      });

      await tx.booking_price_snapshots.create({
        data: {
          booking_id: booking.id,
          rent_krw: options.price.rentKrw,
          service_fee_krw: options.price.serviceFeeKrw,
          utilities_krw: 0,
          total_krw: options.price.totalKrw,
          pricing_version: options.price.pricingVersion,
          nightly_breakdown: [
            {
              nights: options.nights,
              monthly_price_krw: options.monthlyPriceKrw,
              rent_krw: options.price.rentKrw,
              service_fee_krw: options.price.serviceFeeKrw,
            },
          ],
        },
      });

      return booking;
    } catch (error) {
      rethrowBookingOverlap(error);
    }
  }

  async listCustomerBookings(
    customerId: string,
    tx: TransactionClient = this.prisma,
  ): Promise<BookingListRow[]> {
    const rows = await tx.$queryRaw<BookingListRowRecord[]>`
      ${Prisma.raw(BOOKING_LIST_SQL)}
      where b.customer_id = ${customerId}::uuid
      order by b.created_at desc
    `;

    return rows.map(mapBookingListRow);
  }

  async getBooking(
    bookingId: string,
    tx: TransactionClient = this.prisma,
  ): Promise<bookings | null> {
    return tx.bookings.findUnique({
      where: { id: bookingId },
    });
  }

  async getBookingDetailRow(
    bookingId: string,
    tx: TransactionClient = this.prisma,
  ): Promise<BookingListRow | null> {
    const rows = await tx.$queryRaw<BookingListRowRecord[]>`
      ${Prisma.raw(BOOKING_LIST_SQL)}
      where b.id = ${bookingId}::uuid
    `;

    const row = rows[0];
    return row ? mapBookingListRow(row) : null;
  }

  async cancelBooking(
    bookingId: string,
    customerId: string,
    tx: TransactionClient = this.prisma,
  ): Promise<bookings | null> {
    const booking = await tx.bookings.findFirst({
      where: {
        id: bookingId,
        customer_id: customerId,
        status: {
          in: [booking_status.requested, booking_status.pending_payment],
        },
      },
    });

    if (!booking) {
      return null;
    }

    return tx.bookings.update({
      where: { id: bookingId },
      data: {
        status: booking_status.cancelled,
        cancelled_at: new Date(),
      },
    });
  }

  async approveBooking(
    bookingId: string,
    approvedBy: string,
    tx: TransactionClient = this.prisma,
  ): Promise<bookings | null> {
    const booking = await this.getBooking(bookingId, tx);

    if (!booking || booking.status !== booking_status.requested) {
      return null;
    }

    if (
      await this.roomHasBookingConflict(
        booking.room_id,
        booking.check_in,
        booking.check_out,
        tx,
      )
    ) {
      throw new ConflictError(
        'Selected dates conflict with an existing booking hold',
      );
    }

    const settings = await this.getPlatformSettings(tx);
    const now = new Date();

    try {
      return await tx.bookings.update({
        where: { id: bookingId },
        data: {
          status: booking_status.pending_payment,
          hold_expires_at: new Date(
            now.getTime() + settings.hold_ttl_minutes * 60_000,
          ),
          approved_at: now,
          approved_by: approvedBy,
        },
      });
    } catch (error) {
      rethrowBookingOverlap(error);
    }
  }

  async rejectBooking(
    bookingId: string,
    tx: TransactionClient = this.prisma,
  ): Promise<bookings | null> {
    const booking = await tx.bookings.findFirst({
      where: {
        id: bookingId,
        status: booking_status.requested,
      },
    });

    if (!booking) {
      return null;
    }

    return tx.bookings.update({
      where: { id: bookingId },
      data: {
        status: booking_status.rejected,
      },
    });
  }
}

function mapBookingListRow(row: BookingListRowRecord): BookingListRow {
  return {
    id: row.id,
    customerId: row.customer_id,
    status: row.status,
    bookingType: row.booking_type,
    checkIn: row.check_in,
    checkOut: row.check_out,
    guestCount: row.guest_count,
    holdExpiresAt: row.hold_expires_at,
    createdAt: row.created_at,
    customerNotes: row.customer_notes,
    propertyId: row.property_id,
    roomId: row.room_id,
    propertyTitle: row.property_title,
    district: row.district,
    roomName: row.room_name,
    rentKrw: row.rent_krw,
    serviceFeeKrw: row.service_fee_krw,
    totalKrw: row.total_krw,
    pricingVersion: row.pricing_version,
  };
}

function daysBetween(checkIn: Date, checkOut: Date): number {
  return Math.round((checkOut.getTime() - checkIn.getTime()) / 86_400_000);
}
