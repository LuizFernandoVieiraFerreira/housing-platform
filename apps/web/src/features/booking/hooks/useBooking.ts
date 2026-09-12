import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CreateBookingHoldInput, QuoteBookingInput } from '@housing-platform/validation';

import {
  cancelOwnBooking,
  createBookingHold,
  fetchBookingDetail,
  fetchMyBookings,
  quoteBooking,
} from '../api/booking-api';
import { bookingKeys } from '../keys';

export function useBookingQuote(input: QuoteBookingInput | null) {
  return useQuery({
    queryKey: bookingKeys.quote(input),
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
    queryKey: bookingKeys.mine(),
    queryFn: fetchMyBookings,
    staleTime: 30_000,
  });
}

export function useBookingDetail(bookingId: string | undefined) {
  return useQuery({
    queryKey: bookingKeys.detail(bookingId ?? 'unknown'),
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
      void queryClient.invalidateQueries({ queryKey: bookingKeys.mine() });
    },
  });
}

export function useCancelBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: cancelOwnBooking,
    onSuccess: (_data, bookingId) => {
      void queryClient.invalidateQueries({ queryKey: bookingKeys.mine() });
      void queryClient.invalidateQueries({ queryKey: bookingKeys.detail(bookingId) });
    },
  });
}
