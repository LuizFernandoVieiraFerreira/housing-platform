import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CreateBookingHoldInput, QuoteBookingInput } from '@housing-platform/validation';

import {
  cancelOwnBooking,
  createBookingHold,
  fetchBookingDetail,
  fetchMyBookings,
  quoteBooking,
} from '@/features/booking/api/booking-api';
import { queryKeys } from '@/shared/api/query-keys';

export function useBookingQuote(input: QuoteBookingInput | null) {
  return useQuery({
    queryKey: queryKeys.bookings.quote(input),
    queryFn: () => {
      if (!input) {
        throw new Error('Quote input is required');
      }

      return quoteBooking(input);
    },
    enabled: Boolean(input),
    staleTime: 30_000,
  });
}

export function useMyBookings() {
  return useQuery({
    queryKey: queryKeys.bookings.mine,
    queryFn: fetchMyBookings,
    staleTime: 30_000,
  });
}

export function useBookingDetail(bookingId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.bookings.detail(bookingId ?? 'unknown'),
    queryFn: () => {
      if (!bookingId) {
        throw new Error('Booking ID is required');
      }

      return fetchBookingDetail(bookingId);
    },
    enabled: Boolean(bookingId),
    staleTime: 30_000,
  });
}

export function useCreateBookingHold() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateBookingHoldInput) =>
      createBookingHold({
        roomId: input.roomId,
        checkIn: input.checkIn,
        checkOut: input.checkOut,
        guestCount: input.guestCount,
        customerNotes: input.customerNotes || undefined,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.bookings.mine });
    },
  });
}

export function useCancelBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: cancelOwnBooking,
    onSuccess: (_data, bookingId) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.bookings.mine });
      void queryClient.invalidateQueries({ queryKey: queryKeys.bookings.detail(bookingId) });
    },
  });
}
