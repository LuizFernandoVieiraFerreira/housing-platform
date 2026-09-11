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
} from '@/features/admin/api/admin-api';
import { queryKeys } from '@/shared/api/query-keys';

export function useAdminDashboardStats() {
  return useQuery({
    queryKey: queryKeys.admin.dashboard,
    queryFn: fetchAdminDashboardStats,
    staleTime: 30_000,
  });
}

export function useAdminProperties() {
  return useQuery({
    queryKey: queryKeys.admin.properties,
    queryFn: fetchAdminProperties,
    staleTime: 30_000,
  });
}

export function usePublishAdminProperty() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: publishAdminProperty,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.admin.properties });
      void queryClient.invalidateQueries({ queryKey: queryKeys.admin.dashboard });
      void queryClient.invalidateQueries({ queryKey: queryKeys.admin.auditLogs });
    },
  });
}

export function useRejectAdminProperty() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: rejectAdminProperty,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.admin.properties });
      void queryClient.invalidateQueries({ queryKey: queryKeys.admin.dashboard });
      void queryClient.invalidateQueries({ queryKey: queryKeys.admin.auditLogs });
    },
  });
}

export function useAdminHosts() {
  return useQuery({
    queryKey: queryKeys.admin.hosts,
    queryFn: fetchAdminHosts,
    staleTime: 30_000,
  });
}

export function useApproveAdminHost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: approveAdminHost,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.admin.hosts });
      void queryClient.invalidateQueries({ queryKey: queryKeys.admin.dashboard });
      void queryClient.invalidateQueries({ queryKey: queryKeys.admin.auditLogs });
    },
  });
}

export function useAdminBookings() {
  return useQuery({
    queryKey: queryKeys.admin.bookings,
    queryFn: fetchAdminBookings,
    staleTime: 30_000,
  });
}

export function useApproveAdminBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: approveAdminBooking,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.admin.bookings });
      void queryClient.invalidateQueries({ queryKey: queryKeys.admin.dashboard });
    },
  });
}

export function useRejectAdminBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: rejectAdminBooking,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.admin.bookings });
      void queryClient.invalidateQueries({ queryKey: queryKeys.admin.dashboard });
    },
  });
}

export function useAdminPayments() {
  return useQuery({
    queryKey: queryKeys.admin.payments,
    queryFn: fetchAdminPayments,
    staleTime: 30_000,
  });
}

export function useAdminHousingRequests() {
  return useQuery({
    queryKey: queryKeys.admin.housingRequests,
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
      void queryClient.invalidateQueries({ queryKey: queryKeys.admin.housingRequests });
      void queryClient.invalidateQueries({ queryKey: queryKeys.admin.dashboard });
      void queryClient.invalidateQueries({ queryKey: queryKeys.admin.auditLogs });
    },
  });
}

export function useAdminAuditLogs() {
  return useQuery({
    queryKey: queryKeys.admin.auditLogs,
    queryFn: fetchAdminAuditLogs,
    staleTime: 30_000,
  });
}
