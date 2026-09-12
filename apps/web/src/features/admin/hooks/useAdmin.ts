import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { HousingRequestStatus } from '@housing-platform/types';

import {
  approveAdminBooking,
  approveAdminHost,
  fetchAdminAuditLogs,
  fetchAdminBookings,
  fetchAdminDashboardStats,
  fetchAdminHosts,
  fetchAdminHousingRequests,
  fetchAdminPayments,
  fetchAdminProperties,
  publishAdminProperty,
  rejectAdminBooking,
  rejectAdminProperty,
  updateAdminHousingRequestStatus,
} from '../api/admin-api';
import { adminKeys } from '../keys';

export function useAdminDashboardStats() {
  return useQuery({
    queryKey: adminKeys.dashboard(),
    queryFn: fetchAdminDashboardStats,
    staleTime: 30_000,
  });
}

export function useAdminProperties() {
  return useQuery({
    queryKey: adminKeys.properties(),
    queryFn: fetchAdminProperties,
    staleTime: 30_000,
  });
}

export function usePublishAdminProperty() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: publishAdminProperty,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminKeys.properties() });
      void queryClient.invalidateQueries({ queryKey: adminKeys.dashboard() });
      void queryClient.invalidateQueries({ queryKey: adminKeys.auditLogs() });
    },
  });
}

export function useRejectAdminProperty() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: rejectAdminProperty,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminKeys.properties() });
      void queryClient.invalidateQueries({ queryKey: adminKeys.dashboard() });
      void queryClient.invalidateQueries({ queryKey: adminKeys.auditLogs() });
    },
  });
}

export function useAdminHosts() {
  return useQuery({
    queryKey: adminKeys.hosts(),
    queryFn: fetchAdminHosts,
    staleTime: 30_000,
  });
}

export function useApproveAdminHost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: approveAdminHost,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminKeys.hosts() });
      void queryClient.invalidateQueries({ queryKey: adminKeys.dashboard() });
      void queryClient.invalidateQueries({ queryKey: adminKeys.auditLogs() });
    },
  });
}

export function useAdminBookings() {
  return useQuery({
    queryKey: adminKeys.bookings(),
    queryFn: fetchAdminBookings,
    staleTime: 30_000,
  });
}

export function useApproveAdminBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: approveAdminBooking,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminKeys.bookings() });
      void queryClient.invalidateQueries({ queryKey: adminKeys.dashboard() });
    },
  });
}

export function useRejectAdminBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: rejectAdminBooking,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminKeys.bookings() });
      void queryClient.invalidateQueries({ queryKey: adminKeys.dashboard() });
    },
  });
}

export function useAdminPayments() {
  return useQuery({
    queryKey: adminKeys.payments(),
    queryFn: fetchAdminPayments,
    staleTime: 30_000,
  });
}

export function useAdminHousingRequests() {
  return useQuery({
    queryKey: adminKeys.housingRequests(),
    queryFn: fetchAdminHousingRequests,
    staleTime: 30_000,
  });
}

export function useUpdateAdminHousingRequestStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ requestId, status }: { requestId: string; status: HousingRequestStatus }) =>
      updateAdminHousingRequestStatus(requestId, status),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminKeys.housingRequests() });
      void queryClient.invalidateQueries({ queryKey: adminKeys.dashboard() });
      void queryClient.invalidateQueries({ queryKey: adminKeys.auditLogs() });
    },
  });
}

export function useAdminAuditLogs() {
  return useQuery({
    queryKey: adminKeys.auditLogs(),
    queryFn: fetchAdminAuditLogs,
    staleTime: 30_000,
  });
}
