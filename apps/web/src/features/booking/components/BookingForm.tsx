/**
 * Booking form component.
 *
 * Handles the form UI for creating a booking.
 * Business logic is handled by the useBookingPanel hook.
 */

import {
  Alert,
  Button,
  FormField,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from '@housing-platform/ui';
import type { PropertyDetailRoom } from '@housing-platform/types';
import { Controller, type UseFormReturn } from 'react-hook-form';

import type { BookingQuote, CreateBookingHoldInput } from '../model';
import { BookingQuoteSummary } from './BookingQuoteSummary';

interface BookingFormProps {
  form: UseFormReturn<CreateBookingHoldInput>;
  availableRooms: PropertyDetailRoom[];
  selectedRoom: PropertyDetailRoom | undefined;
  quote: BookingQuote | undefined;
  isQuoteLoading: boolean;
  quoteError: string | null;
  submitError: string | null;
  canSubmit: boolean;
  onSubmit: () => void;
  submitButtonLabel: string;
  bookingModeDescription: string;
  formatPrice: (amount: number) => string;
}

export function BookingForm({
  form,
  availableRooms,
  selectedRoom,
  quote,
  isQuoteLoading,
  quoteError,
  submitError,
  canSubmit,
  onSubmit,
  submitButtonLabel,
  bookingModeDescription,
  formatPrice,
}: BookingFormProps) {
  const {
    register,
    control,
    formState: { errors },
  } = form;
  const showRoomSelector = availableRooms.length > 1;

  return (
    <form
      className="mt-6 space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      noValidate
    >
      {/* Room Selection */}
      {showRoomSelector ? (
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

      {/* Date Fields */}
      <FormField label="Check-in" htmlFor="booking-check-in" error={errors.checkIn?.message}>
        <Input
          id="booking-check-in"
          type="date"
          hasError={Boolean(errors.checkIn)}
          {...register('checkIn')}
        />
      </FormField>

      <FormField label="Check-out" htmlFor="booking-check-out" error={errors.checkOut?.message}>
        <Input
          id="booking-check-out"
          type="date"
          hasError={Boolean(errors.checkOut)}
          {...register('checkOut')}
        />
      </FormField>

      {/* Guest Count */}
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

      {/* Notes */}
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

      {/* Quote Error */}
      {quoteError ? <Alert variant="error">{quoteError}</Alert> : null}

      {/* Quote Summary */}
      {quote ? (
        <BookingQuoteSummary quote={quote} formatPrice={formatPrice} />
      ) : isQuoteLoading ? (
        <p className="text-ink-muted text-sm">Calculating price...</p>
      ) : null}

      {/* Submit Error */}
      {submitError ? <Alert variant="error">{submitError}</Alert> : null}

      {/* Submit Button */}
      <Button className="w-full" size="lg" type="submit" disabled={!canSubmit}>
        {submitButtonLabel}
      </Button>

      {/* Mode Description */}
      <p className="text-ink-muted text-center text-xs">{bookingModeDescription}</p>
    </form>
  );
}
