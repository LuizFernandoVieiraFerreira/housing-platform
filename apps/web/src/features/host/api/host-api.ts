import type { HostRecord, HostRow } from '../model';
import { isHostProfile } from '../model';
import { mapHostRow } from './mappers';

import { registerApiRoute } from '@/shared/api/client';
import { wrapSupabaseError } from '@/shared/lib/errors';

export { isHostProfile };

const registerAsHostRequest = registerApiRoute<HostRecord>(
  'hosts',
  'POST',
  '/hosts',
  async ({ client, body }) => {
    const { displayName } = body as { displayName: string };
    const { data, error } = await client.rpc('register_as_host', {
      p_display_name: displayName,
    });

    if (error) {
      throw wrapSupabaseError(error, 'Unable to register as host');
    }

    return mapHostRow(data as HostRow);
  },
);

export function registerAsHost(displayName: string): Promise<HostRecord> {
  return registerAsHostRequest({ body: { displayName } });
}

export const fetchCurrentHost = registerApiRoute<HostRecord | null>(
  'hosts',
  'GET',
  '/hosts/me',
  async ({ client }) => {
    const {
      data: { user },
      error: userError,
    } = await client.auth.getUser();

    if (userError) {
      throw wrapSupabaseError(userError, 'Unable to verify authentication');
    }

    if (!user) {
      return null;
    }

    const { data, error } = await client
      .from('hosts')
      .select('id, profile_id, display_name, status, verified_at, created_at, updated_at')
      .eq('profile_id', user.id)
      .is('deleted_at', null)
      .maybeSingle();

    if (error) {
      throw wrapSupabaseError(error, 'Unable to load host profile');
    }

    return data ? mapHostRow(data as HostRow) : null;
  },
);
