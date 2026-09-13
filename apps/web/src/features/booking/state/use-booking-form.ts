/**
 * Booking form state management.
 *
 * This hook manages the client-side form state for booking creation.
 * It handles form initialization, validation, and derived state.
 */

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, type UseFormReturn } from 'react-hook-form';
import { useEffect, useMemo } from 'react';

import type { CreateBookingHoldInput, QuoteBookingInput } from '../model';
import { createBookingHoldSchema, getDefaultCheckOut } from '../model';

export interface UseBookingFormOptions {
  /** Initial room ID (first available room) */
  defaultRoomId: string;
  /** Initial check-in date from URL params */
  initialCheckIn?: string;
  /** Initial check-out date from URL params */
  initialCheckOut?: string;
  /** Initial guest count from URL params */
  initialGuestCount?: number;
  /** Property's minimum stay nights */
  minStayNights: number;
}

export interface UseBookingFormReturn {
  /** React Hook Form instance */
  form: UseFormReturn<CreateBookingHoldInput>;
  /** Current form values */
  values: CreateBookingHoldInput;
  /** Quote input derived from form (null if invalid) */
  quoteInput: QuoteBookingInput | null;
  /** Whether form is valid for quote */
  canQuote: boolean;
}

/**
 * Hook for managing booking form state.
 *
 * Separates form state management from API calls and UI rendering.
 * The form state can be tested independently.
 */
export function useBookingForm(options: UseBookingFormOptions): UseBookingFormReturn {
  const {
    defaultRoomId,
    initialCheckIn = '',
    initialCheckOut = '',
    initialGuestCount = 1,
    minStayNights,
  } = options;

  const form = useForm<CreateBookingHoldInput>({
    resolver: zodResolver(createBookingHoldSchema),
    defaultValues: {
      roomId: defaultRoomId,
      checkIn: initialCheckIn,
      checkOut: initialCheckOut,
      guestCount: initialGuestCount || 1,
      customerNotes: '',
    },
  });

  const { watch, setValue } = form;

  // Watch form values for derived state
  const roomId = watch('roomId');
  const checkIn = watch('checkIn');
  const checkOut = watch('checkOut');
  const guestCount = watch('guestCount');
  const customerNotes = watch('customerNotes');

  // Update room ID when default changes
  useEffect(() => {
    if (defaultRoomId) {
      setValue('roomId', defaultRoomId);
    }
  }, [defaultRoomId, setValue]);

  // Auto-set checkout when check-in changes (if no checkout set)
  useEffect(() => {
    if (!checkIn || checkOut) {
      return;
    }

    setValue('checkOut', getDefaultCheckOut(checkIn, minStayNights));
  }, [checkIn, checkOut, minStayNights, setValue]);

  // Derive quote input (null if form values are invalid for quoting)
  const quoteInput = useMemo(() => {
    if (!roomId || !checkIn || !checkOut || !guestCount) {
      return null;
    }

    // Validate the quote portion of the form
    const parsed = createBookingHoldSchema.safeParse({
      roomId,
      checkIn,
      checkOut,
      guestCount,
      customerNotes: '',
    });

    if (!parsed.success) {
      return null;
    }

    return {
      roomId: parsed.data.roomId,
      checkIn: parsed.data.checkIn,
      checkOut: parsed.data.checkOut,
      guestCount: parsed.data.guestCount,
    };
  }, [roomId, checkIn, checkOut, guestCount]);

  return {
    form,
    values: { roomId, checkIn, checkOut, guestCount, customerNotes },
    quoteInput,
    canQuote: quoteInput !== null,
  };
}
