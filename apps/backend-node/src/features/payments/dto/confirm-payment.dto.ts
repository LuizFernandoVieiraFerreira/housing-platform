import type { PaymentStatus } from './payment-status.dto';

export interface ConfirmPaymentRequest {
  paymentKey: string;
  orderId: string;
  amount: number;
}

export interface ConfirmPaymentResult {
  paymentId: string;
  orderId: string;
  bookingId: string | null;
  status: PaymentStatus;
}
