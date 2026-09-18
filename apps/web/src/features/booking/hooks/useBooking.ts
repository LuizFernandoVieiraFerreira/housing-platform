import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CreateBookingHoldInput, QuoteBookingInput } from '@housing-platform/validation';

import { unwrap } from '@/shared/lib/result';

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
    queryFn: async () => {
      if (!input) {
        throw new Error('Quote input is required');
      }

      return unwrap(await quoteBooking(input));
    },
    enabled: Boolean(input),
    staleTime: 30_000,
  });
}

export function useMyBookings() {
  return useQuery({
    queryKey: bookingKeys.mine(),
    queryFn: async () => unwrap(await fetchMyBookings()),
    staleTime: 30_000,
  });
}

export function useBookingDetail(bookingId: string | undefined) {
  return useQuery({
    queryKey: bookingKeys.detail(bookingId ?? 'unknown'),
    queryFn: async () => {
      if (!bookingId) {
        throw new Error('Booking ID is required');
      }

      return unwrap(await fetchBookingDetail(bookingId));
    },
    enabled: Boolean(bookingId),
    staleTime: 30_000,
  });
}

export function useCreateBookingHold() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateBookingHoldInput) =>
      unwrap(
        await createBookingHold({
          roomId: input.roomId,
          checkIn: input.checkIn,
          checkOut: input.checkOut,
          guestCount: input.guestCount,
          customerNotes: input.customerNotes || undefined,
        }),
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: bookingKeys.mine() });
    },
  });
}

export function useCancelBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (bookingId: string) => unwrap(await cancelOwnBooking(bookingId)),
    onSuccess: (_data, bookingId) => {
      void queryClient.invalidateQueries({ queryKey: bookingKeys.mine() });
      void queryClient.invalidateQueries({ queryKey: bookingKeys.detail(bookingId) });
    },
  });
}
