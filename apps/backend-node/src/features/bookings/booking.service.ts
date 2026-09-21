import { Injectable } from '@nestjs/common';
import { booking_type } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';
import type { AuthUser } from '../../shared/auth/auth-user.model';
import { AuthorizationService } from '../../shared/auth/authorization.service';
import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from '../../shared/errors';
import { RateLimitService } from '../../shared/rate-limit/rate-limit.service';
import { BookingNotificationService } from './booking-notification.service';
import { BookingPricingService } from './booking-pricing.service';
import type { BookingListRow } from './booking.repository';
import { BookingRepository } from './booking.repository';
import type {
  BookingDetailDto,
  BookingDto,
  BookingListItemDto,
  BookingQuoteDto,
  BookingQuoteQueryDto,
  CreateBookingRequestDto,
} from './dto';
import {
  mapBooking,
  mapBookingDetail,
  mapBookingListItem,
  mapBookingQuote,
} from './mappers/booking.mapper';

@Injectable()
export class BookingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auth: AuthorizationService,
    private readonly repository: BookingRepository,
    private readonly pricing: BookingPricingService,
    private readonly notifications: BookingNotificationService,
    private readonly rateLimit: RateLimitService,
  ) {}

  async quote(
    query: BookingQuoteQueryDto,
    rateLimitActor = 'anon',
  ): Promise<BookingQuoteDto> {
    await this.rateLimit.assertRateLimit(`quote:${rateLimitActor}`, 60, 60);

    const checkIn = parseCalendarDate(query.checkIn, 'checkIn');
    const checkOut = parseCalendarDate(query.checkOut, 'checkOut');
    assertGuestCount(query.guestCount);

    const inputs = await this.repository.validateBookingInputs(
      query.roomId,
      checkIn,
      checkOut,
      query.guestCount,
    );
    const price = await this.pricing.calculatePrice(
      inputs.monthlyPriceKrw,
      inputs.nights,
    );

    return mapBookingQuote({
      roomId: inputs.roomId,
      propertyId: inputs.propertyId,
      bookingMode: inputs.bookingMode,
      nights: inputs.nights,
      rentKrw: price.rentKrw,
      serviceFeeKrw: price.serviceFeeKrw,
      totalKrw: price.totalKrw,
      pricingVersion: price.pricingVersion,
    });
  }

  async listMyBookings(user: AuthUser): Promise<BookingListItemDto[]> {
    const rows = await this.repository.listCustomerBookings(user.id);
    return rows.map((row) => this.mapListRow(row));
  }

  async getBookingDetail(
    user: AuthUser,
    bookingId: string,
  ): Promise<BookingDetailDto> {
    const row = await this.repository.getBookingDetailRow(bookingId);

    if (!row) {
      throw new NotFoundError('Booking not found');
    }

    await this.requireBookingAccess(user, row.propertyId, row.customerId);
    return this.mapDetailRow(row);
  }

  async createBookingHold(
    user: AuthUser,
    request: CreateBookingRequestDto,
  ): Promise<BookingDto> {
    await this.rateLimit.assertRateLimit(`booking_hold:${user.id}`, 10, 60);

    const checkIn = parseCalendarDate(request.checkIn, 'checkIn');
    const checkOut = parseCalendarDate(request.checkOut, 'checkOut');
    assertGuestCount(request.guestCount);

    const inputs = await this.repository.validateBookingInputs(
      request.roomId,
      checkIn,
      checkOut,
      request.guestCount,
    );

    if (
      await this.repository.roomHasBookingConflict(
        request.roomId,
        checkIn,
        checkOut,
      )
    ) {
      throw new ConflictError(
        'Selected dates conflict with an existing booking hold',
      );
    }

    const price = await this.pricing.calculatePrice(
      inputs.monthlyPriceKrw,
      inputs.nights,
    );
    const customerNotes = normalizeNotes(request.customerNotes);

    const booking = await this.prisma.$transaction(async (tx) => {
      const created = await this.repository.createBookingHold(
        {
          customerId: user.id,
          roomId: inputs.roomId,
          propertyId: inputs.propertyId,
          checkIn,
          checkOut,
          guestCount: request.guestCount,
          customerNotes,
          bookingMode: inputs.bookingMode,
          price,
          nights: inputs.nights,
          monthlyPriceKrw: inputs.monthlyPriceKrw,
        },
        tx,
      );

      if (inputs.bookingMode === booking_type.request) {
        await this.notifications.notifyBookingRequest(created, tx);
      }

      return created;
    });

    return mapBooking(booking);
  }

  async cancelBooking(user: AuthUser, bookingId: string): Promise<BookingDto> {
    const booking = await this.repository.getBooking(bookingId);

    if (!booking) {
      throw new NotFoundError('Booking not found');
    }

    if (booking.customer_id !== user.id) {
      throw new ForbiddenError('Cannot cancel this booking');
    }

    const cancelled = await this.prisma.$transaction(async (tx) =>
      this.repository.cancelBooking(bookingId, user.id, tx),
    );

    if (!cancelled) {
      throw new BadRequestError('Booking cannot be cancelled');
    }

    return mapBooking(cancelled);
  }

  async approveBooking(user: AuthUser, bookingId: string): Promise<BookingDto> {
    const booking = await this.repository.getBooking(bookingId);

    if (!booking) {
      throw new NotFoundError('Booking not found');
    }

    await this.auth.requireHostOfBooking(user, bookingId);

    const approved = await this.prisma.$transaction(async (tx) => {
      const updated = await this.repository.approveBooking(
        bookingId,
        user.id,
        tx,
      );

      if (!updated) {
        throw new BadRequestError(
          'Booking must be in requested status to approve',
        );
      }

      await this.notifications.notifyBookingConfirmed(updated, tx);
      return updated;
    });

    return mapBooking(approved);
  }

  async rejectBooking(user: AuthUser, bookingId: string): Promise<BookingDto> {
    const booking = await this.repository.getBooking(bookingId);

    if (!booking) {
      throw new NotFoundError('Booking not found');
    }

    await this.auth.requireHostOfBooking(user, bookingId);

    const rejected = await this.prisma.$transaction(async (tx) => {
      const updated = await this.repository.rejectBooking(bookingId, tx);

      if (!updated) {
        throw new BadRequestError(
          'Booking must be in requested status to reject',
        );
      }

      await this.notifications.notifyBookingRejected(updated, tx);
      return updated;
    });

    return mapBooking(rejected);
  }

  private async requireBookingAccess(
    user: AuthUser,
    propertyId: string,
    customerId: string,
  ): Promise<void> {
    if (customerId === user.id) {
      return;
    }

    if (await this.auth.isAdmin(user.id)) {
      return;
    }

    if (await this.auth.isHostOfProperty(user.id, propertyId)) {
      return;
    }

    throw new ForbiddenError('Booking not found');
  }

  private mapListRow(row: BookingListRow): BookingListItemDto {
    return mapBookingListItem({
      bookingId: row.id,
      status: row.status,
      bookingType: row.bookingType,
      checkIn: row.checkIn,
      checkOut: row.checkOut,
      guestCount: row.guestCount,
      propertyTitle: row.propertyTitle,
      district: row.district,
      roomName: row.roomName,
      totalKrw: row.totalKrw,
      holdExpiresAt: row.holdExpiresAt,
      createdAt: row.createdAt,
    });
  }

  private mapDetailRow(row: BookingListRow): BookingDetailDto {
    const listItem = this.mapListRow(row);

    return mapBookingDetail(listItem, {
      customerNotes: row.customerNotes,
      rentKrw: row.rentKrw,
      serviceFeeKrw: row.serviceFeeKrw,
      pricingVersion: row.pricingVersion,
      propertyId: row.propertyId,
      roomId: row.roomId,
    });
  }
}

function parseCalendarDate(value: string, fieldName: string): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new BadRequestError(`Invalid ${fieldName}`);
  }

  const date = new Date(`${value}T00:00:00.000Z`);

  if (Number.isNaN(date.getTime())) {
    throw new BadRequestError(`Invalid ${fieldName}`);
  }

  return date;
}

function assertGuestCount(guestCount: number): void {
  if (!Number.isInteger(guestCount) || guestCount < 1 || guestCount > 20) {
    throw new BadRequestError('guestCount must be between 1 and 20');
  }
}

function normalizeNotes(customerNotes: string | null | undefined): string | null {
  if (customerNotes == null) {
    return null;
  }

  const trimmed = customerNotes.trim();
  return trimmed.length > 0 ? trimmed : null;
}
