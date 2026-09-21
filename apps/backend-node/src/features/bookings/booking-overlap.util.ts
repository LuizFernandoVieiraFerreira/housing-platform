import { Prisma } from '@prisma/client';

import { ConflictError } from '../../shared/errors';

export function isBookingOverlapError(error: unknown): boolean {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2034') {
      return true;
    }

    if (error.code === 'P2002') {
      const message = error.message.toLowerCase();
      return (
        message.includes('bookings_no_overlap') || message.includes('exclusion')
      );
    }
  }

  const message =
    error instanceof Error
      ? error.message.toLowerCase()
      : String(error).toLowerCase();

  return (
    message.includes('bookings_no_overlap') || message.includes('exclusion')
  );
}

export function rethrowBookingOverlap(error: unknown): never {
  if (isBookingOverlapError(error)) {
    throw new ConflictError(
      'Selected dates conflict with an existing booking hold',
    );
  }

  throw error;
}
