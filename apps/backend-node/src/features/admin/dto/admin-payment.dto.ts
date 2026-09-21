import type { PaymentStatus } from '../../payments/dto/payment-status.dto';

export interface AdminPaymentDto {
  id: string;
  orderId: string;
  bookingId: string;
  amountKrw: number;
  status: PaymentStatus;
  propertyTitle: string | null;
  customerName: string | null;
  confirmedAt: string | null;
  createdAt: string;
}
