import { Injectable } from '@nestjs/common';
import { Prisma, booking_status } from '@prisma/client';
import { randomUUID } from 'node:crypto';

import { PrismaService } from '@/prisma/prisma.service';
import {
  BadRequestError,
  BookingExpiredError,
  ForbiddenError,
} from '@/shared/errors';

export interface PaymentOrderRow {
  paymentId: string;
  orderId: string;
  bookingId: string;
  amountKrw: number;
  orderName: string;
}

export interface PaymentLookupRow {
  id: string;
  orderId: string;
  bookingId: string;
  customerId: string;
  amountKrw: number;
  status: string;
}

interface LockedBookingRow {
  id: string;
  customer_id: string;
  status: booking_status;
  hold_expires_at: Date | null;
  payment_retry_count: number;
  property_id: string;
}

type TransactionClient = Prisma.TransactionClient;

@Injectable()
export class PaymentRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getPaymentByOrderId(orderId: string): Promise<PaymentLookupRow | null> {
    const payment = await this.prisma.payments.findUnique({
      where: { order_id: orderId },
    });

    if (!payment) {
      return null;
    }

    return {
      id: payment.id,
      orderId: payment.order_id,
      bookingId: payment.booking_id,
      customerId: payment.customer_id,
      amountKrw: payment.amount_krw,
      status: payment.status,
    };
  }

  async createPaymentOrder(
    bookingId: string,
    customerId: string,
  ): Promise<PaymentOrderRow> {
    return this.prisma.$transaction(async (tx) =>
      this.createPaymentOrderInTransaction(tx, bookingId, customerId),
    );
  }

  private async createPaymentOrderInTransaction(
    tx: TransactionClient,
    bookingId: string,
    customerId: string,
  ): Promise<PaymentOrderRow> {
    const bookingRows = await tx.$queryRaw<LockedBookingRow[]>`
      SELECT
        id,
        customer_id,
        status,
        hold_expires_at,
        payment_retry_count,
        property_id
      FROM public.bookings
      WHERE id = ${bookingId}::uuid
      FOR UPDATE
    `;

    const booking = bookingRows[0];
    if (!booking || booking.customer_id !== customerId) {
      throw new ForbiddenError('Booking not found');
    }

    const now = new Date();

    if (booking.status === booking_status.payment_failed) {
      if (booking.payment_retry_count >= 1) {
        throw new BadRequestError('Payment retry limit reached');
      }

      const settings = await this.getPlatformSettings(tx);
      await tx.bookings.update({
        where: { id: bookingId },
        data: {
          status: booking_status.pending_payment,
          payment_retry_count: booking.payment_retry_count + 1,
          hold_expires_at: new Date(
            now.getTime() + settings.hold_ttl_minutes * 60 * 1000,
          ),
        },
      });
      booking.status = booking_status.pending_payment;
      booking.hold_expires_at = new Date(
        now.getTime() + settings.hold_ttl_minutes * 60 * 1000,
      );
    } else if (booking.status !== booking_status.pending_payment) {
      throw new ForbiddenError('Booking is not awaiting payment');
    }

    if (booking.hold_expires_at !== null && booking.hold_expires_at <= now) {
      await tx.bookings.update({
        where: { id: bookingId },
        data: { status: booking_status.expired },
      });
      throw new BookingExpiredError();
    }

    const snapshot = await tx.booking_price_snapshots.findUnique({
      where: { booking_id: bookingId },
    });
    if (!snapshot) {
      throw new BadRequestError('Booking price snapshot missing');
    }

    const property = await tx.properties.findUnique({
      where: { id: booking.property_id },
      select: { title: true },
    });

    const orderId = randomUUID();
    const payment = await tx.payments.create({
      data: {
        order_id: orderId,
        booking_id: bookingId,
        customer_id: customerId,
        amount_krw: snapshot.total_krw,
        status: 'pending',
      },
    });

    return {
      paymentId: payment.id,
      orderId: payment.order_id,
      bookingId: payment.booking_id,
      amountKrw: payment.amount_krw,
      orderName: property?.title ?? 'Housing Platform stay',
    };
  }

  private async getPlatformSettings(tx: TransactionClient) {
    const settings = await tx.platform_settings.findUnique({
      where: { id: 1 },
    });
    if (!settings) {
      throw new BadRequestError('Platform settings are not configured');
    }
    return settings;
  }
}
