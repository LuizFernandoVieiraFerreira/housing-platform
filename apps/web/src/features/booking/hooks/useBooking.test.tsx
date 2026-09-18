import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AppError, Result } from '@/shared/lib/result';

import {
  useBookingDetail,
  useBookingQuote,
  useCancelBooking,
  useCreateBookingHold,
  useMyBookings,
} from './useBooking';
import { bookingKeys } from '../keys';

// Mock the API functions
const mockQuoteBooking = vi.fn();
const mockFetchMyBookings = vi.fn();
const mockFetchBookingDetail = vi.fn();
const mockCreateBookingHold = vi.fn();
const mockCancelOwnBooking = vi.fn();

vi.mock('../api/booking-api', () => ({
  quoteBooking: (input: unknown) => mockQuoteBooking(input),
  fetchMyBookings: () => mockFetchMyBookings(),
  fetchBookingDetail: (id: string) => mockFetchBookingDetail(id),
  createBookingHold: (input: unknown) => mockCreateBookingHold(input),
  cancelOwnBooking: (id: string) => mockCancelOwnBooking(id),
}));

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
}

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe('useBookingQuote', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns data when input is provided', async () => {
    const mockQuote = {
      roomId: 'room-1',
      propertyId: 'property-1',
      nights: 30,
      rentKrw: 800_000,
      serviceFeeKrw: 80_000,
      totalKrw: 880_000,
    };
    mockQuoteBooking.mockResolvedValue(Result.ok(mockQuote));

    const queryClient = createTestQueryClient();
    const { result } = renderHook(
      () =>
        useBookingQuote({
          roomId: 'room-1',
          checkIn: '2026-01-01',
          checkOut: '2026-01-31',
          guestCount: 1,
        }),
      { wrapper: createWrapper(queryClient) },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockQuote);
    expect(mockQuoteBooking).toHaveBeenCalledWith({
      roomId: 'room-1',
      checkIn: '2026-01-01',
      checkOut: '2026-01-31',
      guestCount: 1,
    });
  });

  it('does not fetch when input is null', () => {
    const queryClient = createTestQueryClient();
    const { result } = renderHook(() => useBookingQuote(null), {
      wrapper: createWrapper(queryClient),
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.isFetching).toBe(false);
    expect(mockQuoteBooking).not.toHaveBeenCalled();
  });

  it('handles error state', async () => {
    mockQuoteBooking.mockResolvedValue(
      Result.err(new AppError('API_ERROR', 'Quote failed')),
    );

    const queryClient = createTestQueryClient();
    const { result } = renderHook(
      () =>
        useBookingQuote({
          roomId: 'room-1',
          checkIn: '2026-01-01',
          checkOut: '2026-01-31',
          guestCount: 1,
        }),
      { wrapper: createWrapper(queryClient) },
    );

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBeInstanceOf(Error);
  });
});

describe('useMyBookings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches bookings on mount', async () => {
    const mockBookings = [
      { id: 'booking-1', status: 'confirmed' },
      { id: 'booking-2', status: 'pending_payment' },
    ];
    mockFetchMyBookings.mockResolvedValue(Result.ok(mockBookings));

    const queryClient = createTestQueryClient();
    const { result } = renderHook(() => useMyBookings(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockBookings);
    expect(mockFetchMyBookings).toHaveBeenCalled();
  });
});

describe('useBookingDetail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches booking detail when ID is provided', async () => {
    const mockBooking = {
      id: 'booking-1',
      status: 'confirmed',
      propertyTitle: 'Test Property',
    };
    mockFetchBookingDetail.mockResolvedValue(Result.ok(mockBooking));

    const queryClient = createTestQueryClient();
    const { result } = renderHook(() => useBookingDetail('booking-1'), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockBooking);
    expect(mockFetchBookingDetail).toHaveBeenCalledWith('booking-1');
  });

  it('does not fetch when ID is undefined', () => {
    const queryClient = createTestQueryClient();
    const { result } = renderHook(() => useBookingDetail(undefined), {
      wrapper: createWrapper(queryClient),
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.isFetching).toBe(false);
    expect(mockFetchBookingDetail).not.toHaveBeenCalled();
  });
});

describe('useCreateBookingHold', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates booking hold and invalidates cache', async () => {
    const mockBooking = { id: 'booking-1', status: 'pending_payment' };
    mockCreateBookingHold.mockResolvedValue(Result.ok(mockBooking));

    const queryClient = createTestQueryClient();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useCreateBookingHold(), {
      wrapper: createWrapper(queryClient),
    });

    result.current.mutate({
      roomId: 'room-1',
      checkIn: '2026-01-01',
      checkOut: '2026-01-31',
      guestCount: 1,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockCreateBookingHold).toHaveBeenCalledWith({
      roomId: 'room-1',
      checkIn: '2026-01-01',
      checkOut: '2026-01-31',
      guestCount: 1,
      customerNotes: undefined,
    });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: bookingKeys.mine() });
  });

  it('includes customerNotes when provided', async () => {
    mockCreateBookingHold.mockResolvedValue(Result.ok({ id: 'booking-1' }));

    const queryClient = createTestQueryClient();
    const { result } = renderHook(() => useCreateBookingHold(), {
      wrapper: createWrapper(queryClient),
    });

    result.current.mutate({
      roomId: 'room-1',
      checkIn: '2026-01-01',
      checkOut: '2026-01-31',
      guestCount: 2,
      customerNotes: 'Arriving late',
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockCreateBookingHold).toHaveBeenCalledWith({
      roomId: 'room-1',
      checkIn: '2026-01-01',
      checkOut: '2026-01-31',
      guestCount: 2,
      customerNotes: 'Arriving late',
    });
  });
});

describe('useCancelBooking', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('cancels booking and invalidates both caches', async () => {
    const mockCancelledBooking = { id: 'booking-1', status: 'cancelled' };
    mockCancelOwnBooking.mockResolvedValue(Result.ok(mockCancelledBooking));

    const queryClient = createTestQueryClient();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useCancelBooking(), {
      wrapper: createWrapper(queryClient),
    });

    result.current.mutate('booking-1');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockCancelOwnBooking).toHaveBeenCalledWith('booking-1');
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: bookingKeys.mine() });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: bookingKeys.detail('booking-1') });
  });
});
