/**
 * Data transformation functions for support API.
 */

import type { ChannelBootResult } from '../model';

export function mapChannelBootResult(data: unknown): ChannelBootResult | null {
  if (typeof data !== 'object' || data === null) {
    return null;
  }

  const result = data as ChannelBootResult;

  if ('pluginKey' in result && result.pluginKey != null && typeof result.pluginKey !== 'string') {
    return null;
  }

  return result;
}
