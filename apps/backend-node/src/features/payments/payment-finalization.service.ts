import { Injectable } from '@nestjs/common';
import { Prisma, booking_status, payments } from '@prisma/client';

import { PrismaService } from '@/prisma/prisma.service';
import {
  BadRequestError,
  BookingExpiredError,
  NotFoundError,
  PaymentAmountMismatchError,
} from '@/shared/errors';

import type { TossPaymentPayload } from './toss.client';

type TransactionClient = Prisma.TransactionClient;

interface LockedPaymentRow {
  id: string;
  order_id: string;
  booking_id: string;
  amount_krw: number;
  status: string;
  payment_key: string | null;
  confirmed_at: Date | null;
}

interface LockedBookingRow {
  id: string;
  status: booking_status;
  hold_expires_at: Date | null;
}

interface PaymentEventRow {
  id: string;
  event_id: string;
  payment_id: string | null;
  booking_id: string | null;
  event_type: string;
  payload: Prisma.JsonValue;
  processed_at: Date;
}

@Injectable()
export class PaymentFinalizationService {
  constructor(private readonly prisma: PrismaService) {}

  async finalizeSuccessfulPayment(input: {
    orderId: string;
    paymentKey: string;
    amountKrw: number;
    tossResponse: TossPaymentPayload | null;
    tx?: TransactionClient;
  }): Promise<payments> {
    if (input.tx) {
      return this.finalizeSuccessfulPaymentInTransaction(input.tx, input);
    }

    return this.prisma.$transaction((tx) =>
      this.finalizeSuccessfulPaymentInTransaction(tx, input),
    );
  }

  async markPaymentFailed(input: {
    orderId: string;
    reason: string | null;
    tossResponse: TossPaymentPayload | null;
    tx?: TransactionClient;
  }): Promise<payments> {
    if (input.tx) {
      return this.markPaymentFailedInTransaction(input.tx, input);
    }

    return this.prisma.$transaction((tx) =>
      this.markPaymentFailedInTransaction(tx, input),
    );
  }

  async recordPaymentEvent(input: {
    eventId: string;
    paymentId: string;
    bookingId: string;
    eventType: string;
    payload: Record<string, unknown>;
    tx?: TransactionClient;
  }): Promise<PaymentEventRow | null> {
    const client = input.tx ?? this.prisma;

    const inserted = await client.$queryRaw<PaymentEventRow[]>`
      INSERT INTO public.payment_events (
        event_id,
        payment_id,
        booking_id,
        event_type,
        payload
      )
      VALUES (
        ${input.eventId},
        ${input.paymentId}::uuid,
        ${input.bookingId}::uuid,
        ${input.eventType},
        ${JSON.stringify(input.payload)}::jsonb
      )
      ON CONFLICT (event_id) DO NOTHING
      RETURNING
        id,
        event_id,
        payment_id,
        booking_id,
        event_type,
        payload,
        processed_at
    `;

    if (inserted.length > 0) {
      return inserted[0] ?? null;
    }

    return client.payment_events.findUnique({
      where: { event_id: input.eventId },
    });
  }

  private async finalizeSuccessfulPaymentInTransaction(
    tx: TransactionClient,
    input: {
      orderId: string;
      paymentKey: string;
      amountKrw: number;
      tossResponse: TossPaymentPayload | null;
    },
  ): Promise<payments> {
    const paymentRows = await tx.$queryRaw<LockedPaymentRow[]>`
      SELECT
        id,
        order_id,
        booking_id,
        amount_krw,
        status,
        payment_key,
        confirmed_at
      FROM public.payments
      WHERE order_id = ${input.orderId}::uuid
      FOR UPDATE
    `;

    const lockedPayment = paymentRows[0];
    if (!lockedPayment) {
      throw new NotFoundError('Payment not found');
    }

    if (lockedPayment.status === 'confirmed') {
      return tx.payments.findUniqueOrThrow({
        where: { order_id: input.orderId },
      });
    }

    if (lockedPayment.amount_krw !== input.amountKrw) {
      throw new PaymentAmountMismatchError('Payment amount mismatch');
    }

    const bookingRows = await tx.$queryRaw<LockedBookingRow[]>`
      SELECT id, status, hold_expires_at
      FROM public.bookings
      WHERE id = ${lockedPayment.booking_id}::uuid
      FOR UPDATE
    `;

    const booking = bookingRows[0];
    if (!booking) {
      throw new NotFoundError('Booking not found');
    }

    const now = new Date();

    if (booking.status === booking_status.confirmed) {
      return tx.payments.update({
        where: { order_id: input.orderId },
        data: {
          status: 'confirmed',
          payment_key: input.paymentKey,
          toss_response: (input.tossResponse ?? undefined) as Prisma.InputJsonValue | undefined,
          confirmed_at: lockedPayment.confirmed_at ?? now,
        },
      });
    }

    if (booking.status !== booking_status.pending_payment) {
      throw new BadRequestError('Booking is not awaiting payment');
    }

    if (booking.hold_expires_at !== null && booking.hold_expires_at <= now) {
      await tx.bookings.update({
        where: { id: lockedPayment.booking_id },
        data: { status: booking_status.expired },
      });
      throw new BookingExpiredError();
    }

    await tx.bookings.update({
      where: { id: lockedPayment.booking_id },
      data: { status: booking_status.confirmed },
    });

    return tx.payments.update({
      where: { order_id: input.orderId },
      data: {
        status: 'confirmed',
        payment_key: input.paymentKey,
        toss_response: (input.tossResponse ?? undefined) as Prisma.InputJsonValue | undefined,
        confirmed_at: now,
      },
    });
  }

  private async markPaymentFailedInTransaction(
    tx: TransactionClient,
    input: {
      orderId: string;
      reason: string | null;
      tossResponse: TossPaymentPayload | null;
    },
  ): Promise<payments> {
    const paymentRows = await tx.$queryRaw<LockedPaymentRow[]>`
      SELECT
        id,
        order_id,
        booking_id,
        amount_krw,
        status,
        payment_key,
        confirmed_at
      FROM public.payments
      WHERE order_id = ${input.orderId}::uuid
      FOR UPDATE
    `;

    const lockedPayment = paymentRows[0];
    if (!lockedPayment) {
      throw new NotFoundError('Payment not found');
    }

    if (lockedPayment.status === 'confirmed') {
      return tx.payments.findUniqueOrThrow({
        where: { order_id: input.orderId },
      });
    }

    const trimmedReason = input.reason?.trim() ?? null;

    const payment = await tx.payments.update({
      where: { order_id: input.orderId },
      data: {
        status: 'failed',
        failed_reason: trimmedReason || null,
        toss_response: (input.tossResponse ?? undefined) as Prisma.InputJsonValue | undefined,
      },
    });

    const booking = await tx.bookings.findUnique({
      where: { id: lockedPayment.booking_id },
    });

    if (
      booking &&
      (booking.status === booking_status.pending_payment ||
        booking.status === booking_status.payment_failed)
    ) {
      await tx.bookings.update({
        where: { id: lockedPayment.booking_id },
        data: { status: booking_status.payment_failed },
      });
    }

    return payment;
  }
}
