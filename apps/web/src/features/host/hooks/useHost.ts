import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { HostPropertyInput, HostRoomInput } from '@housing-platform/validation';

import { useAuth } from '@/features/auth';
import { fetchCurrentHost, registerAsHost } from '../api/host-api';
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
} from '../api/host-properties-api';
import { hostKeys } from '../keys';
import { accountKeys } from '@/features/account/keys';

export function useCurrentHost() {
  const { user, isAuthenticated } = useAuth();

  return useQuery({
    queryKey: hostKeys.current(),
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
      queryClient.setQueryData(hostKeys.current(), host);
      void queryClient.invalidateQueries({ queryKey: accountKeys.profile.all });
    },
  });
}

export function useHostProperties() {
  return useQuery({
    queryKey: hostKeys.properties.all(),
    queryFn: fetchHostProperties,
    staleTime: 30_000,
  });
}

export function useHostProperty(propertyId: string | undefined) {
  return useQuery({
    queryKey: hostKeys.properties.detail(propertyId ?? 'unknown'),
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
    queryKey: hostKeys.amenities(),
    queryFn: fetchAmenities,
    staleTime: 300_000,
  });
}

export function useCreateHostProperty() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createHostProperty,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: hostKeys.properties.all() });
    },
  });
}

export function useUpdateHostProperty(propertyId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: HostPropertyInput) => updateHostProperty(propertyId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: hostKeys.properties.all() });
      void queryClient.invalidateQueries({ queryKey: hostKeys.properties.detail(propertyId) });
    },
  });
}

export function useCreateHostRoom(propertyId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: HostRoomInput) => createHostRoom(propertyId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: hostKeys.properties.detail(propertyId) });
      void queryClient.invalidateQueries({ queryKey: hostKeys.properties.all() });
    },
  });
}

export function useDeleteHostRoom(propertyId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteHostRoom,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: hostKeys.properties.detail(propertyId) });
      void queryClient.invalidateQueries({ queryKey: hostKeys.properties.all() });
    },
  });
}

export function useSubmitHostProperty(propertyId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => submitHostPropertyForReview(propertyId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: hostKeys.properties.all() });
      void queryClient.invalidateQueries({ queryKey: hostKeys.properties.detail(propertyId) });
    },
  });
}

export function useHostBookings() {
  return useQuery({
    queryKey: hostKeys.bookings(),
    queryFn: fetchHostBookings,
    staleTime: 30_000,
  });
}

export function useApproveHostBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: approveHostBooking,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: hostKeys.bookings() });
    },
  });
}

export function useRejectHostBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: rejectHostBooking,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: hostKeys.bookings() });
    },
  });
}
