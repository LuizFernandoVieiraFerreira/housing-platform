import { supabase } from '@/shared/api/supabase';
import { AppError, wrapSupabaseError } from '@/shared/lib/errors';

import type { ChannelBootResult } from '../model';
import { mapChannelBootResult } from './mappers';

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

  const bootResult = mapChannelBootResult(data);

  if (!bootResult) {
    throw new AppError('API_ERROR', 'Unable to initialize chat support');
  }

  return bootResult;
}
