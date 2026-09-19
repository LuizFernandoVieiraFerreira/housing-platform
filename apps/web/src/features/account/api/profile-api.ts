import type { Profile } from '@housing-platform/types';

import { registerApiRoute } from '@/shared/api/client';
import { AppError, wrapSupabaseError } from '@/shared/lib/errors';

import type { ProfileUpdateInput } from '../model';
import { mapProfileRow, toProfileUpdatePayload } from './mappers';

function requiredUserId(value: unknown): string {
  if (typeof value !== 'string' || value.length === 0) {
    throw new AppError('INVALID_INPUT', 'Missing query param: userId.');
  }
  return value;
}

const fetchCurrentProfileRequest = registerApiRoute<Profile | null>(
  'profile',
  'GET',
  '/profile',
  async ({ client, query }) => {
    const userId = requiredUserId(query.userId);
    const { data, error } = await client.from('profiles').select('*').eq('id', userId).maybeSingle();

    if (error) {
      throw wrapSupabaseError(error, 'Unable to load profile');
    }

    return mapProfileRow(data as Profile | null);
  },
);

export function fetchCurrentProfile(userId: string): Promise<Profile | null> {
  return fetchCurrentProfileRequest({ query: { userId } });
}

const updateCurrentProfileRequest = registerApiRoute<Profile>(
  'profile',
  'PATCH',
  '/profile',
  async ({ client, query, body }) => {
    const userId = requiredUserId(query.userId);
    const input = body as ProfileUpdateInput;
    const { data, error } = await client
      .from('profiles')
      .update(toProfileUpdatePayload(input))
      .eq('id', userId)
      .select('*')
      .single();

    if (error) {
      throw wrapSupabaseError(error, 'Unable to update profile');
    }

    const profile = mapProfileRow(data as Profile);

    if (!profile) {
      throw wrapSupabaseError(new Error('Profile update returned no data'), 'Unable to update profile');
    }

    return profile;
  },
);

export function updateCurrentProfile(userId: string, input: ProfileUpdateInput): Promise<Profile> {
  return updateCurrentProfileRequest({ query: { userId }, body: input });
}
