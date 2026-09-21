import { Module } from '@nestjs/common';

import { BookingNotificationService } from './booking-notification.service';
import { BookingPricingService } from './booking-pricing.service';
import { BookingRepository } from './booking.repository';
import { BookingService } from './booking.service';
import { BookingsController } from './bookings.controller';

@Module({
  controllers: [BookingsController],
  providers: [
    BookingService,
    BookingRepository,
    BookingPricingService,
    BookingNotificationService,
  ],
})
export class BookingsModule {}
