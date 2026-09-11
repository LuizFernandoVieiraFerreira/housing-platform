import type { Database, Profile } from '@housing-platform/types';

import { supabase } from '@/shared/api/supabase';

type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

export async function fetchCurrentProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data as Profile | null;
}

export async function updateCurrentProfile(
  userId: string,
  input: Pick<
    Profile,
    'full_name' | 'phone' | 'avatar_url' | 'preferred_language' | 'marketing_consent'
  >,
): Promise<Profile> {
  const payload: ProfileUpdate = {
    full_name: input.full_name,
    phone: input.phone,
    avatar_url: input.avatar_url,
    preferred_language: input.preferred_language,
    marketing_consent: input.marketing_consent,
  };

  const { data, error } = await supabase
    .from('profiles')
    .update(payload)
    .eq('id', userId)
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  return data as Profile;
}
