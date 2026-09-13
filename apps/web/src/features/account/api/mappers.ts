/**
 * Data transformation functions for account API.
 */

import type { Database } from '@housing-platform/types';

import type { Profile, ProfileUpdateInput } from '../model';

export type ProfileRow = Profile;
export type ProfileUpdatePayload = Database['public']['Tables']['profiles']['Update'];

export function mapProfileRow(row: ProfileRow | null): Profile | null {
  return row;
}

export function toProfileUpdatePayload(input: ProfileUpdateInput): ProfileUpdatePayload {
  return {
    full_name: input.full_name,
    phone: input.phone,
    avatar_url: input.avatar_url,
    preferred_language: input.preferred_language,
    marketing_consent: input.marketing_consent,
  };
}
