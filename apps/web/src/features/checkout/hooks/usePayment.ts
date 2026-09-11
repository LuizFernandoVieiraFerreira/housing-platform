import { useMutation, useQueryClient } from '@tanstack/react-query';

import { confirmPayment, createPaymentOrder } from '@/features/checkout/api/payment-api';
import { queryKeys } from '@/shared/api/query-keys';

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
      void queryClient.invalidateQueries({ queryKey: queryKeys.bookings.mine });

      if (result.bookingId) {
        void queryClient.invalidateQueries({
          queryKey: queryKeys.bookings.detail(result.bookingId),
        });
      }
    },
  });
}
