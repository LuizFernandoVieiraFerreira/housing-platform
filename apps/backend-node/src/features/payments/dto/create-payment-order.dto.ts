export interface CreatePaymentOrderRequest {
  bookingId: string;
}

export interface CreatePaymentOrderResult {
  paymentId: string;
  orderId: string;
  bookingId: string;
  amountKrw: number;
  orderName: string;
}
