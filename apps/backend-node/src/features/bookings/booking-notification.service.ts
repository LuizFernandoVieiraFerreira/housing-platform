import { Injectable } from '@nestjs/common';
import type { bookings, Prisma } from '@prisma/client';
import { notification_type } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';

type TransactionClient = Prisma.TransactionClient;

const DATE_FORMAT: Intl.DateTimeFormatOptions = {
  month: 'short',
  day: '2-digit',
  year: 'numeric',
  timeZone: 'UTC',
};

@Injectable()
export class BookingNotificationService {
  constructor(private readonly prisma: PrismaService) {}

  async notifyBookingRequest(
    booking: bookings,
    tx: TransactionClient = this.prisma,
  ): Promise<void> {
    const propertyRow = await tx.properties.findUnique({
      where: { id: booking.property_id },
      include: {
        hosts: true,
      },
    });

    if (!propertyRow?.hosts) {
      return;
    }

    const guestName = await this.guestName(booking.customer_id, tx);

    await tx.notifications.create({
      data: {
        user_id: propertyRow.hosts.profile_id,
        type: notification_type.booking_request,
        title: 'New booking request',
        body: `${guestName} requested to stay at ${propertyRow.title} (${formatDate(booking.check_in)} – ${formatDate(booking.check_out)})`,
        metadata: { bookingId: booking.id },
      },
    });
  }

  async notifyBookingConfirmed(
    booking: bookings,
    tx: TransactionClient = this.prisma,
  ): Promise<void> {
    const propertyRow = await tx.properties.findUnique({
      where: { id: booking.property_id },
      include: {
        hosts: true,
      },
    });

    if (!propertyRow) {
      return;
    }

    if (!(await this.profileExists(booking.customer_id, tx))) {
      return;
    }

    const hostName = hostDisplayName(propertyRow.hosts);

    await tx.notifications.create({
      data: {
        user_id: booking.customer_id,
        type: notification_type.booking_confirmed,
        title: 'Booking confirmed',
        body: `${hostName} confirmed your booking for ${propertyRow.title}, ${formatDate(booking.check_in)} – ${formatDate(booking.check_out)}`,
        metadata: { bookingId: booking.id },
      },
    });
  }

  async notifyBookingRejected(
    booking: bookings,
    tx: TransactionClient = this.prisma,
  ): Promise<void> {
    const propertyRow = await tx.properties.findUnique({
      where: { id: booking.property_id },
      include: {
        hosts: true,
      },
    });

    if (!propertyRow || !(await this.profileExists(booking.customer_id, tx))) {
      return;
    }

    await tx.notifications.create({
      data: {
        user_id: booking.customer_id,
        type: notification_type.booking_rejected,
        title: 'Booking request declined',
        body: `Your request to stay at ${propertyRow.title} (${formatDate(booking.check_in)} – ${formatDate(booking.check_out)}) was declined`,
        metadata: { bookingId: booking.id },
      },
    });
  }

  private async guestName(
    customerId: string,
    tx: TransactionClient,
  ): Promise<string> {
    const profile = await tx.profiles.findFirst({
      where: {
        id: customerId,
        deleted_at: null,
      },
      select: { full_name: true },
    });

    if (!profile) {
      return 'A guest';
    }

    const name = profile.full_name.trim();
    return name.length > 0 ? name : 'A guest';
  }

  private async profileExists(
    profileId: string,
    tx: TransactionClient,
  ): Promise<boolean> {
    const count = await tx.profiles.count({
      where: {
        id: profileId,
        deleted_at: null,
      },
    });

    return count > 0;
  }
}

function formatDate(value: Date): string {
  return new Intl.DateTimeFormat('en-US', DATE_FORMAT).format(value);
}

function hostDisplayName(
  host: { display_name: string } | null | undefined,
): string {
  if (!host?.display_name) {
    return 'Your host';
  }

  const name = host.display_name.trim();
  return name.length > 0 ? name : 'Your host';
}
