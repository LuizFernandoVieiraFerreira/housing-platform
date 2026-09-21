import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import type { AuthUser } from '../../shared/auth/auth-user.model';
import {
  AuthGuard,
  CurrentUser,
  OptionalAuthGuard,
  Public,
} from '../../shared/auth';
import { RequireUser } from '../../shared/auth/require-user.decorator';
import { BadRequestError } from '../../shared/errors';
import { BookingService } from './booking.service';
import type {
  BookingDetailDto,
  BookingDto,
  BookingListItemDto,
  BookingQuoteDto,
  CreateBookingRequestDto,
} from './dto';

@Controller('bookings')
@UseGuards(AuthGuard)
export class BookingsController {
  constructor(private readonly bookingService: BookingService) {}

  @Public()
  @UseGuards(OptionalAuthGuard)
  @Get('quote')
  quoteBooking(
    @Query('roomId') roomId: string | undefined,
    @Query('checkIn') checkIn: string | undefined,
    @Query('checkOut') checkOut: string | undefined,
    @Query('guestCount') guestCountRaw: string | undefined,
    @CurrentUser() user: AuthUser | undefined,
  ): Promise<BookingQuoteDto> {
    if (!roomId || !checkIn || !checkOut || guestCountRaw === undefined) {
      throw new BadRequestError(
        'roomId, checkIn, checkOut, and guestCount are required',
      );
    }

    const guestCount = Number.parseInt(guestCountRaw, 10);

    if (Number.isNaN(guestCount)) {
      throw new BadRequestError('guestCount must be a number');
    }

    const rateLimitActor = user?.id ?? 'anon';

    return this.bookingService.quote(
      { roomId, checkIn, checkOut, guestCount },
      rateLimitActor,
    );
  }

  @Get()
  listBookings(
    @RequireUser() user: AuthUser,
  ): Promise<BookingListItemDto[]> {
    return this.bookingService.listMyBookings(user);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  createBooking(
    @RequireUser() user: AuthUser,
    @Body() request: CreateBookingRequestDto,
  ): Promise<BookingDto> {
    return this.bookingService.createBookingHold(user, request);
  }

  @Get(':bookingId')
  getBooking(
    @RequireUser() user: AuthUser,
    @Param('bookingId') bookingId: string,
  ): Promise<BookingDetailDto> {
    return this.bookingService.getBookingDetail(user, bookingId);
  }

  @Post(':bookingId/cancel')
  cancelBooking(
    @RequireUser() user: AuthUser,
    @Param('bookingId') bookingId: string,
  ): Promise<BookingDto> {
    return this.bookingService.cancelBooking(user, bookingId);
  }

  @Post(':bookingId/approve')
  approveBooking(
    @RequireUser() user: AuthUser,
    @Param('bookingId') bookingId: string,
  ): Promise<BookingDto> {
    return this.bookingService.approveBooking(user, bookingId);
  }

  @Post(':bookingId/reject')
  rejectBooking(
    @RequireUser() user: AuthUser,
    @Param('bookingId') bookingId: string,
  ): Promise<BookingDto> {
    return this.bookingService.rejectBooking(user, bookingId);
  }
}
