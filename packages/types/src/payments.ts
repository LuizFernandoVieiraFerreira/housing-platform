export type PaymentStatus = 'pending' | 'confirmed' | 'failed' | 'cancelled';

export interface Payment {
  id: string;
  order_id: string;
  payment_key: string | null;
  booking_id: string;
  customer_id: string;
  amount_krw: number;
  status: PaymentStatus;
  toss_response: unknown;
  failed_reason: string | null;
  confirmed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreatePaymentOrderResult {
  paymentId: string;
  orderId: string;
  bookingId: string;
  amountKrw: number;
  orderName: string;
}

export interface ConfirmPaymentResult {
  paymentId: string;
  orderId: string;
  bookingId: string | null;
  status: PaymentStatus;
}
