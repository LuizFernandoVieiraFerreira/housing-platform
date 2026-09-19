import { getApiClient } from '@/shared/api/client';
import { AppError } from '@/shared/lib/errors';

import type { ChannelBootResult } from '../model';
import { mapChannelBootResult } from './mappers';

export function getChannelPluginKey(): string | null {
  const pluginKey = import.meta.env.VITE_CHANNEL_PLUGIN_KEY?.trim();
  return pluginKey || null;
}

export async function fetchChannelBoot(): Promise<ChannelBootResult> {
  const data = await getApiClient('auth').request<unknown>({
    method: 'GET',
    path: '/support/channel-boot',
  });

  const bootResult = mapChannelBootResult(data);

  if (!bootResult) {
    throw new AppError('API_ERROR', 'Unable to initialize chat support');
  }

  return bootResult;
}
