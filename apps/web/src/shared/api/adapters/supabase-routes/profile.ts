import { toProfileUpdatePayload } from '@/features/account/api/mappers';

import { wrapSupabaseError } from '@/shared/lib/errors';

import { registerSupabaseRoute } from '../supabase-adapter';
import { assertNoSupabaseError, requireAuthenticatedUser } from './helpers';

export const PROFILE_ROUTES = [
  { method: 'GET' as const, path: '/profile' },
  { method: 'PATCH' as const, path: '/profile' },
];

export function registerProfileRoutes(): void {
  registerSupabaseRoute('GET', '/profile', async ({ client }) => {
    const userId = await requireAuthenticatedUser(client);

    const { data, error } = await client
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    assertNoSupabaseError(error, 'Unable to load profile');
    return data;
  });

  registerSupabaseRoute('PATCH', '/profile', async ({ client, body }) => {
    const userId = await requireAuthenticatedUser(client);
    const input = body as Parameters<typeof toProfileUpdatePayload>[0];

    const { data, error } = await client
      .from('profiles')
      .update(toProfileUpdatePayload(input))
      .eq('id', userId)
      .select('*')
      .single();

    assertNoSupabaseError(error, 'Unable to update profile');

    if (!data) {
      throw wrapSupabaseError(new Error('Profile update returned no data'), 'Unable to update profile');
    }

    return data;
  });
}
