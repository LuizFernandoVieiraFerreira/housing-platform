import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const DEFAULT_SUPABASE_URL = 'http://127.0.0.1:54321';
const DEFAULT_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';
const DEFAULT_SERVICE_ROLE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

export const HONGDAE_ROOM_ID = '55555555-5555-4555-8555-555555555501';
export const REQUEST_BOOKING_ROOM_ID = '55555555-5555-4555-8555-555555555502';
export const SEED_HOST_USER_ID = '22222222-2222-4222-8222-222222222201';
export const SEED_HOST_EMAIL = 'host@gmail.com';
export const SEED_HOST_PASSWORD = '1234qwer';
export const DRAFT_PROPERTY_ID = '44444444-4444-4444-8444-444444444499';
export const HONGDAE_PROPERTY_ID = '44444444-4444-4444-8444-444444444401';
export const MAPO_WORKSTATION_PROPERTY_ID = '44444444-4444-4444-8444-444444444430';
export const SNU_MICRO_PROPERTY_ID = '44444444-4444-4444-8444-444444444411';
export const YEOUIDO_FINANCE_PROPERTY_ID = '44444444-4444-4444-8444-444444444421';

export const EMBEDDING_DIMENSIONS = 1536;

export function unitEmbeddingVector(
  activeIndex: number,
  dimensions = EMBEDDING_DIMENSIONS,
): string {
  const values = Array.from({ length: dimensions }, () => 0);
  values[activeIndex % dimensions] = 1;
  return `[${values.join(',')}]`;
}

export function getSupabaseUrl(): string {
  return process.env.SUPABASE_URL ?? DEFAULT_SUPABASE_URL;
}

export function getAnonKey(): string {
  return process.env.SUPABASE_ANON_KEY ?? DEFAULT_ANON_KEY;
}

export function getServiceRoleKey(): string {
  return process.env.SUPABASE_SERVICE_ROLE_KEY ?? DEFAULT_SERVICE_ROLE_KEY;
}

export function getFunctionsUrl(): string {
  return process.env.SUPABASE_FUNCTIONS_URL ?? `${getSupabaseUrl()}/functions/v1`;
}

export function createServiceClient(): SupabaseClient {
  return createClient(getSupabaseUrl(), getServiceRoleKey(), {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export function createAnonClient(): SupabaseClient {
  return createClient(getSupabaseUrl(), getAnonKey(), {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export async function isSupabaseReachable(): Promise<boolean> {
  try {
    const response = await fetch(`${getSupabaseUrl()}/rest/v1/`, {
      headers: {
        apikey: getAnonKey(),
      },
    });

    return response.ok;
  } catch {
    return false;
  }
}

export async function createTestUser(
  label: string,
): Promise<{ email: string; password: string; id: string }> {
  const service = createServiceClient();
  const email = `${label}-${crypto.randomUUID().slice(0, 8)}@integration.local`;
  const password = 'password123';

  const { data, error } = await service.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: `Integration ${label}`,
    },
  });

  if (error || !data.user) {
    throw error ?? new Error('Unable to create test user');
  }

  return {
    email,
    password,
    id: data.user.id,
  };
}

export async function signInAs(email: string, password: string): Promise<SupabaseClient> {
  const client = createAnonClient();
  const { error } = await client.auth.signInWithPassword({ email, password });

  if (error) {
    throw error;
  }

  return client;
}

export function futureBookingDates(offsetDays = 45): { checkIn: string; checkOut: string } {
  const checkInDate = new Date();
  checkInDate.setUTCDate(checkInDate.getUTCDate() + offsetDays);
  const checkOutDate = new Date(checkInDate);
  checkOutDate.setUTCDate(checkOutDate.getUTCDate() + 30);

  return {
    checkIn: checkInDate.toISOString().slice(0, 10),
    checkOut: checkOutDate.toISOString().slice(0, 10),
  };
}

export function uniqueBookingDates(suiteKey: string): { checkIn: string; checkOut: string } {
  let hash = 0;

  for (const character of suiteKey) {
    hash = (hash * 31 + character.charCodeAt(0)) % 997;
  }

  const runSalt = Math.floor(Math.random() * 900);
  return futureBookingDates(150 + hash + runSalt);
}

export async function cleanupBooking(bookingId: string): Promise<void> {
  const service = createServiceClient();

  await service.from('payments').delete().eq('booking_id', bookingId);
  await service.from('booking_price_snapshots').delete().eq('booking_id', bookingId);
  await service.from('bookings').delete().eq('id', bookingId);
}

export async function deleteTestUser(userId: string): Promise<void> {
  const service = createServiceClient();

  const { data: bookings } = await service.from('bookings').select('id').eq('customer_id', userId);

  for (const booking of bookings ?? []) {
    await cleanupBooking(booking.id);
  }

  await service.from('notifications').delete().eq('user_id', userId);

  await service.auth.admin.deleteUser(userId);
}
