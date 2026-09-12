import type { HostRecord } from '@housing-platform/types';

import { supabase } from '@/shared/api/supabase';
import { wrapSupabaseError } from '@/shared/lib/errors';

export async function registerAsHost(displayName: string): Promise<HostRecord> {
  const { data, error } = await supabase.rpc('register_as_host', {
    p_display_name: displayName,
  });

  if (error) {
    throw wrapSupabaseError(error, 'Unable to register as host');
  }

  return data as HostRecord;
}

export async function fetchCurrentHost(): Promise<HostRecord | null> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw wrapSupabaseError(userError, 'Unable to verify authentication');
  }

  if (!user) {
    return null;
  }

  const { data, error } = await supabase
    .from('hosts')
    .select('id, profile_id, display_name, status, verified_at, created_at, updated_at')
    .eq('profile_id', user.id)
    .is('deleted_at', null)
    .maybeSingle();

  if (error) {
    throw wrapSupabaseError(error, 'Unable to load host profile');
  }

  return (data as HostRecord | null) ?? null;
}

export function isHostProfile(role: string | undefined): boolean {
  return role === 'host' || role === 'admin';
}
