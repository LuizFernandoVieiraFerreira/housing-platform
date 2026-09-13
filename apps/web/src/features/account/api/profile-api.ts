import type { Profile } from '@housing-platform/types';

import { supabase } from '@/shared/api/supabase';
import { wrapSupabaseError } from '@/shared/lib/errors';

import type { ProfileUpdateInput } from '../model';
import { mapProfileRow, toProfileUpdatePayload } from './mappers';

export async function fetchCurrentProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    throw wrapSupabaseError(error, 'Unable to load profile');
  }

  return mapProfileRow(data as Profile | null);
}

export async function updateCurrentProfile(
  userId: string,
  input: ProfileUpdateInput,
): Promise<Profile> {
  const { data, error } = await supabase
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
}
