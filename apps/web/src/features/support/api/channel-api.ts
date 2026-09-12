import type { ChannelBootResult } from '@housing-platform/types';

import { supabase } from '@/shared/api/supabase';
import { wrapSupabaseError } from '@/shared/lib/errors';

export function getChannelPluginKey(): string | null {
  const pluginKey = import.meta.env.VITE_CHANNEL_PLUGIN_KEY?.trim();
  return pluginKey || null;
}

export async function fetchChannelBoot(): Promise<ChannelBootResult> {
  const { data, error } = await supabase.functions.invoke('channel-boot', {
    method: 'GET',
  });

  if (error) {
    throw wrapSupabaseError(error, 'Unable to initialize chat support');
  }

  return data as ChannelBootResult;
}
