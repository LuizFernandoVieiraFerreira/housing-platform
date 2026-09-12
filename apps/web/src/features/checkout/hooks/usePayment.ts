import { useMutation, useQueryClient } from '@tanstack/react-query';

import { confirmPayment, createPaymentOrder } from '../api/payment-api';
import { bookingKeys } from '@/features/booking/keys';

export function useCreatePaymentOrder() {
  return useMutation({
    mutationFn: createPaymentOrder,
  });
}

export function useConfirmPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: confirmPayment,
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
