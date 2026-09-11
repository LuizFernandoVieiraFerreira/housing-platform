import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@/features/auth/hooks/useAuth';
import { fetchCurrentHost, registerAsHost } from '@/features/host/api/host-api';
import {
  approveHostBooking,
  createHostProperty,
  createHostRoom,
  deleteHostRoom,
  fetchAmenities,
  fetchHostBookings,
  fetchHostProperties,
  fetchHostProperty,
  rejectHostBooking,
  submitHostPropertyForReview,
  updateHostProperty,
} from '@/features/host/api/host-properties-api';
import { queryKeys } from '@/shared/api/query-keys';
import type { HostPropertyInput, HostRoomInput } from '@housing-platform/validation';

export function useCurrentHost() {
  const { user, isAuthenticated } = useAuth();

  return useQuery({
    queryKey: queryKeys.host.current,
    queryFn: fetchCurrentHost,
    enabled: isAuthenticated && Boolean(user?.id),
    staleTime: 60_000,
  });
}

export function useRegisterHost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: registerAsHost,
    onSuccess: (host) => {
      queryClient.setQueryData(queryKeys.host.current, host);
      void queryClient.invalidateQueries({ queryKey: ['profile', 'current'] });
    },
  });
}

export function useHostProperties() {
  return useQuery({
    queryKey: queryKeys.host.properties,
    queryFn: fetchHostProperties,
    staleTime: 30_000,
  });
}

export function useHostProperty(propertyId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.host.property(propertyId ?? 'unknown'),
    queryFn: () => {
      if (!propertyId) {
        throw new Error('Property ID is required');
      }

      return fetchHostProperty(propertyId);
    },
    enabled: Boolean(propertyId),
    staleTime: 30_000,
  });
}

export function useAmenities() {
  return useQuery({
    queryKey: queryKeys.host.amenities,
    queryFn: fetchAmenities,
    staleTime: 300_000,
  });
}

export function useCreateHostProperty() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createHostProperty,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.host.properties });
    },
  });
}

export function useUpdateHostProperty(propertyId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: HostPropertyInput) => updateHostProperty(propertyId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.host.properties });
      void queryClient.invalidateQueries({ queryKey: queryKeys.host.property(propertyId) });
    },
  });
}

export function useCreateHostRoom(propertyId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: HostRoomInput) => createHostRoom(propertyId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.host.property(propertyId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.host.properties });
    },
  });
}

export function useDeleteHostRoom(propertyId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteHostRoom,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.host.property(propertyId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.host.properties });
    },
  });
}

export function useSubmitHostProperty(propertyId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => submitHostPropertyForReview(propertyId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.host.properties });
      void queryClient.invalidateQueries({ queryKey: queryKeys.host.property(propertyId) });
    },
  });
}

export function useHostBookings() {
  return useQuery({
    queryKey: queryKeys.host.bookings,
    queryFn: fetchHostBookings,
    staleTime: 30_000,
  });
}

export function useApproveHostBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: approveHostBooking,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.host.bookings });
    },
  });
}

export function useRejectHostBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: rejectHostBooking,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.host.bookings });
    },
  });
}
