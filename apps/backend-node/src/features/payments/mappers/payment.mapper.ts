import type { payments } from '@prisma/client';

import type { ConfirmPaymentResult, CreatePaymentOrderResult } from '../dto';
import { PaymentStatus } from '../dto';

export function mapCreatePaymentOrderResult(input: {
  paymentId: string;
  orderId: string;
  bookingId: string;
  amountKrw: number;
  orderName: string;
}): CreatePaymentOrderResult {
  return {
    paymentId: input.paymentId,
    orderId: input.orderId,
    bookingId: input.bookingId,
    amountKrw: input.amountKrw,
    orderName: input.orderName,
  };
}

export function mapConfirmPaymentResult(
  payment: payments,
  bookingId?: string | null,
): ConfirmPaymentResult {
  return {
    paymentId: payment.id,
    orderId: payment.order_id,
    bookingId: bookingId !== undefined ? bookingId : payment.booking_id,
    status: payment.status as PaymentStatus,
  };
}
