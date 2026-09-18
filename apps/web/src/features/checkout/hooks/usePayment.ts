import { useMutation, useQueryClient } from '@tanstack/react-query';

import { unwrap } from '@/shared/lib/result';

import { confirmPayment, createPaymentOrder } from '../api/payment-api';
import { bookingKeys } from '@/features/booking/keys';

export function useCreatePaymentOrder() {
  return useMutation({
    mutationFn: async (bookingId: string) => unwrap(await createPaymentOrder(bookingId)),
  });
}

export function useConfirmPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { paymentKey: string; orderId: string; amount: number }) =>
      unwrap(await confirmPayment(input)),
    onSuccess: (result) => {
      void queryClient.invalidateQueries({ queryKey: bookingKeys.mine() });

      if (result.bookingId) {
        void queryClient.invalidateQueries({
          queryKey: bookingKeys.detail(result.bookingId),
        });
      }
    },
  });
}
