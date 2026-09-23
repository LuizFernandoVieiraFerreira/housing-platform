/**
 * Presenter hook for BookingPanel.
 *
 * Combines form state, API calls, and navigation logic into a clean interface.
 * The component only handles rendering, all business logic lives here.
 */

import type { PropertyDetail, PropertyDetailRoom } from '@housing-platform/types';
import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { useAuth } from '@/features/auth/hooks/useAuth';
import { track } from '@/shared/analytics';
import { getBookingErrorMessage } from '../lib/booking-utils';
import { useBookingQuote, useCreateBookingHold } from './useBooking';
import { useBookingForm } from '../state';
import type { BookingQuote, CreateBookingHoldInput } from '../model';

// ============================================================================
// Types
// ============================================================================

export type BookingPanelState =
  | { status: 'no-rooms' }
  | { status: 'unauthenticated'; returnTo: string }
  | { status: 'unverified' }
  | { status: 'ready' };

export interface UseBookingPanelOptions {
  property: PropertyDetail;
}

export interface UseBookingPanelReturn {
  // State
  state: BookingPanelState;
  
  // Property data
  property: PropertyDetail;
  availableRooms: PropertyDetailRoom[];
  selectedRoom: PropertyDetailRoom | undefined;
  
  // Form
  form: ReturnType<typeof useBookingForm>['form'];
  formErrors: Record<string, { message?: string }>;
  
  // Quote
  quote: BookingQuote | undefined;
  isQuoteLoading: boolean;
  quoteError: string | null;
  
  // Submission
  submitError: string | null;
  isSubmitting: boolean;
  canSubmit: boolean;
  handleSubmit: () => void;
  
  // Display helpers
  displayPrice: number;
  bookingModeLabel: string;
  submitButtonLabel: string;
  bookingModeDescription: string;
}

// ============================================================================
// Hook Implementation
// ============================================================================

export function useBookingPanel({ property }: UseBookingPanelOptions): UseBookingPanelReturn {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated, isEmailVerified } = useAuth();
  
  const createBooking = useCreateBookingHold();
  const [submitError, setSubmitError] = useState<string | null>(null);

  // ============================================================================
  // Derived Data
  // ============================================================================

  const availableRooms = useMemo(
    () => property.rooms.filter((room) => room.status === 'available'),
    [property.rooms],
  );

  const defaultRoomId = availableRooms[0]?.id ?? '';

  // ============================================================================
  // Form State
  // ============================================================================

  const {
    form,
    quoteInput,
  } = useBookingForm({
    defaultRoomId,
    initialCheckIn: searchParams.get('checkIn') ?? undefined,
    initialCheckOut: searchParams.get('checkOut') ?? undefined,
    initialGuestCount: Number(searchParams.get('guests')) || undefined,
    minStayNights: property.minStayNights,
  });

  const roomId = form.watch('roomId');
  const selectedRoom = useMemo(
    () => availableRooms.find((room) => room.id === roomId) ?? availableRooms[0],
    [availableRooms, roomId],
  );

  // ============================================================================
  // Quote
  // ============================================================================

  const {
    data: quote,
    isFetching: isQuoteLoading,
    error: quoteErrorRaw,
  } = useBookingQuote(quoteInput);

  const quoteError = quoteErrorRaw
    ? getBookingErrorMessage(quoteErrorRaw, 'Unable to calculate price for these dates.')
    : null;

  // Track quote viewed when quote loads
  const trackedQuoteKey = useRef<string | null>(null);
  useEffect(() => {
    if (quote) {
      const quoteKey = `${property.id}-${quote.totalKrw}-${quote.nights}`;
      if (trackedQuoteKey.current !== quoteKey) {
        trackedQuoteKey.current = quoteKey;
        track({
          name: 'booking_quote_viewed',
          properties: {
            property_id: property.id,
            total_price_krw: quote.totalKrw,
            stay_nights: quote.nights,
          },
        });
      }
    }
  }, [quote, property.id]);

  // ============================================================================
  // Panel State
  // ============================================================================

  const returnTo = `/listings/${property.id}?${searchParams.toString()}`;

  const state = useMemo((): BookingPanelState => {
    if (availableRooms.length === 0) {
      return { status: 'no-rooms' };
    }
    if (!isAuthenticated) {
      return { status: 'unauthenticated', returnTo };
    }
    if (!isEmailVerified) {
      return { status: 'unverified' };
    }
    return { status: 'ready' };
  }, [availableRooms.length, isAuthenticated, isEmailVerified, returnTo]);

  // ============================================================================
  // Submission
  // ============================================================================

  const handleSubmit = useCallback(() => {
    form.handleSubmit(async (values: CreateBookingHoldInput) => {
      setSubmitError(null);

      // Track booking started
      track({
        name: 'booking_started',
        properties: {
          property_id: property.id,
          room_id: values.roomId,
          booking_mode: property.bookingMode,
        },
      });

      try {
        const booking = await createBooking.mutateAsync(values);

        // Track booking hold created (use quote price as booking row doesn't include price)
        track({
          name: 'booking_hold_created',
          properties: {
            booking_id: booking.id,
            property_id: property.id,
            total_price_krw: quote?.totalKrw ?? 0,
          },
        });

        if (booking.status === 'pending_payment') {
          navigate(`/checkout/${booking.id}`);
          return;
        }

        navigate(`/bookings/${booking.id}`);
      } catch (error) {
        setSubmitError(getBookingErrorMessage(error, 'Unable to create booking.'));
      }
    })();
  }, [form, createBooking, navigate, property.id, property.bookingMode]);

  const canSubmit = Boolean(quote) && !createBooking.isPending;
  const isSubmitting = createBooking.isPending;

  // ============================================================================
  // Display Helpers
  // ============================================================================

  const displayPrice = selectedRoom?.monthlyPriceKrw ?? property.monthlyPriceMin;
  
  const bookingModeLabel = property.bookingMode === 'instant' 
    ? 'Instant book' 
    : 'Request to book';

  const submitButtonLabel = isSubmitting
    ? 'Submitting...'
    : property.bookingMode === 'instant'
      ? 'Reserve and pay next'
      : 'Request to book';

  const bookingModeDescription = property.bookingMode === 'instant'
    ? 'Instant bookings hold the room for 15 minutes while you complete payment.'
    : 'The host will review your request before you can pay.';

  // ============================================================================
  // Return
  // ============================================================================

  return {
    state,
    property,
    availableRooms,
    selectedRoom,
    form,
    formErrors: form.formState.errors,
    quote,
    isQuoteLoading,
    quoteError,
    submitError,
    isSubmitting,
    canSubmit,
    handleSubmit,
    displayPrice,
    bookingModeLabel,
    submitButtonLabel,
    bookingModeDescription,
  };
}
