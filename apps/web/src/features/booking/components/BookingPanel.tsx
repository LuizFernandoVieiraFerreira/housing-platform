import { zodResolver } from '@hookform/resolvers/zod';
import { Alert, Button, Card, FormField, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Textarea } from '@housing-platform/ui';
import type { PropertyDetail } from '@housing-platform/types';
import { createBookingHoldSchema, type CreateBookingHoldInput } from '@housing-platform/validation';
import { useEffect, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';

import { getBookingErrorMessage } from '@/features/booking/lib/booking-utils';
import { useBookingQuote, useCreateBookingHold } from '@/features/booking/hooks/useBooking';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useFormatPrice } from '@/i18n/CurrencyProvider';

interface BookingPanelProps {
  property: PropertyDetail;
}

function getDefaultCheckOut(checkIn: string, minStayNights: number): string {
  const date = new Date(`${checkIn}T00:00:00`);
  date.setDate(date.getDate() + minStayNights);
  return date.toISOString().slice(0, 10);
}

export function BookingPanel({ property }: BookingPanelProps) {
  const navigate = useNavigate();
  const formatPrice = useFormatPrice();
  const [searchParams] = useSearchParams();
  const { isAuthenticated, isEmailVerified } = useAuth();
  const createBooking = useCreateBookingHold();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const availableRooms = property.rooms.filter((room) => room.status === 'available');
  const defaultRoomId = availableRooms[0]?.id ?? '';

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    formState: { errors },
  } = useForm<CreateBookingHoldInput>({
    resolver: zodResolver(createBookingHoldSchema),
    defaultValues: {
      roomId: defaultRoomId,
      checkIn: searchParams.get('checkIn') ?? '',
      checkOut: searchParams.get('checkOut') ?? '',
      guestCount: Number(searchParams.get('guests') ?? 1) || 1,
      customerNotes: '',
    },
  });

  useEffect(() => {
    if (defaultRoomId) {
      setValue('roomId', defaultRoomId);
    }
  }, [defaultRoomId, setValue]);

  const roomId = watch('roomId');
  const checkIn = watch('checkIn');
  const checkOut = watch('checkOut');
  const guestCount = watch('guestCount');

  const selectedRoom = availableRooms.find((room) => room.id === roomId) ?? availableRooms[0];

  useEffect(() => {
    if (!checkIn || checkOut) {
      return;
    }

    setValue('checkOut', getDefaultCheckOut(checkIn, property.minStayNights));
  }, [checkIn, checkOut, property.minStayNights, setValue]);

  const quoteInput = useMemo(() => {
    if (!roomId || !checkIn || !checkOut || !guestCount) {
      return null;
    }

    const parsed = createBookingHoldSchema.safeParse({
      roomId,
      checkIn,
      checkOut,
      guestCount,
      customerNotes: '',
    });

    return parsed.success ? parsed.data : null;
  }, [roomId, checkIn, checkOut, guestCount]);

  const { data: quote, isFetching: isQuoteLoading, error: quoteError } = useBookingQuote(quoteInput);

  const returnTo = `/listings/${property.id}?${searchParams.toString()}`;

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null);

    try {
      const booking = await createBooking.mutateAsync(values);

      if (booking.status === 'pending_payment') {
        navigate(`/checkout/${booking.id}`);
        return;
      }

      navigate(`/bookings/${booking.id}`);
    } catch (error) {
      setSubmitError(getBookingErrorMessage(error, 'Unable to create booking.'));
    }
  });

  if (availableRooms.length === 0) {
    return (
      <Card padding="md">
        <Alert variant="error">No rooms are currently available to book.</Alert>
      </Card>
    );
  }

  if (!isAuthenticated) {
    return (
      <Card padding="md">
        <p className="text-ink text-2xl font-bold">
          {formatPrice(property.monthlyPriceMin)}
          <span className="text-ink-muted text-base font-normal">+/30 days</span>
        </p>
        <p className="text-ink-muted mt-2 text-sm">
          Minimum stay: {property.minStayNights} nights · {property.bookingMode === 'instant' ? 'Instant book' : 'Request to book'}
        </p>
        <Link to={`/login?returnTo=${encodeURIComponent(returnTo)}`} className="mt-6 block">
          <Button className="w-full" size="lg">
            Sign in to book
          </Button>
        </Link>
      </Card>
    );
  }

  if (!isEmailVerified) {
    return (
      <Card padding="md">
        <Alert variant="error">Verify your email before booking a stay.</Alert>
        <Link to="/signup/verify-email" className="mt-4 inline-flex">
          <Button variant="secondary">Go to verification</Button>
        </Link>
      </Card>
    );
  }

  return (
    <Card padding="md">
      <p className="text-ink text-2xl font-bold">
        {selectedRoom ? formatPrice(selectedRoom.monthlyPriceKrw) : formatPrice(property.monthlyPriceMin)}
        <span className="text-ink-muted text-base font-normal">/30 days</span>
      </p>
      <p className="text-ink-muted mt-2 text-sm">
        Minimum stay: {property.minStayNights} nights ·{' '}
        {property.bookingMode === 'instant' ? 'Instant book' : 'Request to book'}
      </p>

      <form className="mt-6 space-y-4" onSubmit={onSubmit} noValidate>
        {availableRooms.length > 1 ? (
          <FormField label="Room" htmlFor="booking-room" error={errors.roomId?.message}>
            <Controller
              name="roomId"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger
                    id="booking-room"
                    className="w-full"
                    hasError={Boolean(errors.roomId)}
                  >
                    <SelectValue placeholder="Select a room" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableRooms.map((room) => (
                      <SelectItem key={room.id} value={room.id}>
                        {room.name} · up to {room.maxOccupancy} guest
                        {room.maxOccupancy === 1 ? '' : 's'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </FormField>
        ) : (
          <input type="hidden" {...register('roomId')} />
        )}

        <FormField label="Check-in" htmlFor="booking-check-in" error={errors.checkIn?.message}>
          <Input id="booking-check-in" type="date" hasError={Boolean(errors.checkIn)} {...register('checkIn')} />
        </FormField>

        <FormField label="Check-out" htmlFor="booking-check-out" error={errors.checkOut?.message}>
          <Input id="booking-check-out" type="date" hasError={Boolean(errors.checkOut)} {...register('checkOut')} />
        </FormField>

        <FormField label="Guests" htmlFor="booking-guests" error={errors.guestCount?.message}>
          <Input
            id="booking-guests"
            type="number"
            min={1}
            max={selectedRoom?.maxOccupancy ?? 20}
            hasError={Boolean(errors.guestCount)}
            {...register('guestCount')}
          />
        </FormField>

        <FormField
          label="Notes for the host (optional)"
          htmlFor="booking-notes"
          error={errors.customerNotes?.message}
        >
          <Textarea
            id="booking-notes"
            placeholder="Share arrival details or questions"
            hasError={Boolean(errors.customerNotes)}
            {...register('customerNotes')}
          />
        </FormField>

        {quoteError ? (
          <Alert variant="error">
            {getBookingErrorMessage(quoteError, 'Unable to calculate price for these dates.')}
          </Alert>
        ) : null}

        {quote ? (
          <div className="border-surface-subtle space-y-2 rounded-lg border bg-surface-muted/40 p-4 text-sm">
            <div className="flex justify-between">
              <span className="text-ink-muted">
                Rent ({quote.nights} night{quote.nights === 1 ? '' : 's'})
              </span>
              <span className="text-ink">{formatPrice(quote.rentKrw)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-muted">Service fee</span>
              <span className="text-ink">{formatPrice(quote.serviceFeeKrw)}</span>
            </div>
            <div className="border-surface-subtle flex justify-between border-t pt-2 font-semibold">
              <span className="text-ink">Total</span>
              <span className="text-ink">{formatPrice(quote.totalKrw)}</span>
            </div>
          </div>
        ) : isQuoteLoading ? (
          <p className="text-ink-muted text-sm">Calculating price...</p>
        ) : null}

        {submitError ? <Alert variant="error">{submitError}</Alert> : null}

        <Button
          className="w-full"
          size="lg"
          type="submit"
          disabled={!quote || createBooking.isPending}
        >
          {createBooking.isPending
            ? 'Submitting...'
            : property.bookingMode === 'instant'
              ? 'Reserve and pay next'
              : 'Request to book'}
        </Button>

        <p className="text-ink-muted text-center text-xs">
          {property.bookingMode === 'instant'
            ? 'Instant bookings hold the room for 15 minutes while you complete payment.'
            : 'The host will review your request before you can pay.'}
        </p>
      </form>
    </Card>
  );
}
