import type { HousingRequestStatus } from '@housing-platform/types';

import { registerSupabaseRoute } from '../supabase-adapter';
import { assertNoSupabaseError, requirePathParam } from './helpers';

export const ADMIN_ROUTES = [
  { method: 'GET' as const, path: '/admin/stats' },
  { method: 'GET' as const, path: '/admin/properties' },
  { method: 'POST' as const, path: '/admin/properties/:id/publish' },
  { method: 'POST' as const, path: '/admin/properties/:id/reject' },
  { method: 'GET' as const, path: '/admin/hosts' },
  { method: 'POST' as const, path: '/admin/hosts/:id/approve' },
  { method: 'GET' as const, path: '/admin/bookings' },
  { method: 'GET' as const, path: '/admin/payments' },
  { method: 'GET' as const, path: '/admin/housing-requests' },
  { method: 'PATCH' as const, path: '/admin/housing-requests/:id' },
  { method: 'GET' as const, path: '/admin/audit-logs' },
];

export function registerAdminRoutes(): void {
  registerSupabaseRoute('GET', '/admin/stats', async ({ client }) => {
    const [propertiesResult, hostsResult, bookingsResult, housingRequestsResult] =
      await Promise.all([
        client
          .from('properties')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'pending_review')
          .is('deleted_at', null),
        client
          .from('hosts')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'pending')
          .is('deleted_at', null),
        client
          .from('bookings')
          .select('id', { count: 'exact', head: true })
          .in('status', ['requested', 'pending_payment', 'payment_failed']),
        client
          .from('housing_requests')
          .select('id', { count: 'exact', head: true })
          .in('status', ['new', 'in_progress']),
      ]);

    assertNoSupabaseError(propertiesResult.error, 'Unable to load dashboard stats');
    assertNoSupabaseError(hostsResult.error, 'Unable to load dashboard stats');
    assertNoSupabaseError(bookingsResult.error, 'Unable to load dashboard stats');
    assertNoSupabaseError(housingRequestsResult.error, 'Unable to load dashboard stats');

    return {
      pendingProperties: propertiesResult.count ?? 0,
      pendingHosts: hostsResult.count ?? 0,
      openBookings: bookingsResult.count ?? 0,
      openHousingRequests: housingRequestsResult.count ?? 0,
    };
  });

  registerSupabaseRoute('GET', '/admin/properties', async ({ client }) => {
    const { data, error } = await client
      .from('properties')
      .select(
        `
        id,
        title,
        slug,
        property_type,
        district,
        status,
        booking_mode,
        monthly_price_min,
        updated_at,
        rooms ( id ),
        hosts ( display_name )
      `,
      )
      .is('deleted_at', null)
      .order('updated_at', { ascending: false });

    assertNoSupabaseError(error, 'Unable to load properties');
    return data ?? [];
  });

  registerSupabaseRoute('POST', '/admin/properties/:id/publish', async ({ client, params }) => {
    const { data, error } = await client.rpc('publish_property', {
      p_property_id: requirePathParam(params, 'id'),
    });

    assertNoSupabaseError(error, 'Unable to publish property');
    return data;
  });

  registerSupabaseRoute('POST', '/admin/properties/:id/reject', async ({ client, params }) => {
    const { data, error } = await client.rpc('reject_property_review', {
      p_property_id: requirePathParam(params, 'id'),
    });

    assertNoSupabaseError(error, 'Unable to reject property');
    return data;
  });

  registerSupabaseRoute('GET', '/admin/hosts', async ({ client }) => {
    const { data, error } = await client
      .from('hosts')
      .select(
        `
        id,
        display_name,
        status,
        verified_at,
        created_at,
        profiles ( full_name )
      `,
      )
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    assertNoSupabaseError(error, 'Unable to load hosts');
    return data ?? [];
  });

  registerSupabaseRoute('POST', '/admin/hosts/:id/approve', async ({ client, params }) => {
    const { data, error } = await client.rpc('approve_host', {
      p_host_id: requirePathParam(params, 'id'),
    });

    assertNoSupabaseError(error, 'Unable to approve host');
    return data;
  });

  registerSupabaseRoute('GET', '/admin/bookings', async ({ client }) => {
    const { data, error } = await client
      .from('bookings')
      .select(
        `
        id,
        status,
        booking_type,
        check_in,
        check_out,
        guest_count,
        customer_notes,
        created_at,
        properties ( title ),
        rooms ( name ),
        booking_price_snapshots ( total_krw ),
        profiles!customer_id ( full_name )
      `,
      )
      .order('created_at', { ascending: false });

    assertNoSupabaseError(error, 'Unable to load bookings');
    return data ?? [];
  });

  registerSupabaseRoute('GET', '/admin/payments', async ({ client }) => {
    const { data, error } = await client
      .from('payments')
      .select(
        `
        id,
        order_id,
        booking_id,
        amount_krw,
        status,
        confirmed_at,
        created_at,
        bookings (
          properties ( title ),
          profiles!customer_id ( full_name )
        )
      `,
      )
      .order('created_at', { ascending: false });

    assertNoSupabaseError(error, 'Unable to load payments');
    return data ?? [];
  });

  registerSupabaseRoute('GET', '/admin/housing-requests', async ({ client }) => {
    const { data, error } = await client
      .from('housing_requests')
      .select(
        'id, email, desired_area, check_in, check_out, budget_max, accommodation_type, notes, status, created_at',
      )
      .order('created_at', { ascending: false });

    assertNoSupabaseError(error, 'Unable to load housing requests');
    return data ?? [];
  });

  registerSupabaseRoute('PATCH', '/admin/housing-requests/:id', async ({ client, params, body }) => {
    const input = body as { status: HousingRequestStatus };

    const { data, error } = await client.rpc('update_housing_request_status', {
      p_request_id: requirePathParam(params, 'id'),
      p_status: input.status,
    });

    assertNoSupabaseError(error, 'Unable to update request status');
    return data;
  });

  registerSupabaseRoute('GET', '/admin/audit-logs', async ({ client }) => {
    const { data, error } = await client
      .from('audit_logs')
      .select(
        `
        id,
        action,
        entity_type,
        entity_id,
        metadata,
        created_at,
        profiles ( full_name )
      `,
      )
      .order('created_at', { ascending: false })
      .limit(100);

    assertNoSupabaseError(error, 'Unable to load audit logs');
    return data ?? [];
  });
}
