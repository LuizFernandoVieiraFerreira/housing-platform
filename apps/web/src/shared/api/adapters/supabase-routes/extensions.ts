import { AppError } from '@/shared/lib/errors';

import { registerSupabaseRoute } from '../supabase-adapter';
import { assertNoSupabaseError, extractInlineFunctionError, parseEdgeFunctionError } from './helpers';

export const EXTENSION_ROUTES = [
  { method: 'POST' as const, path: '/search/ai' },
  { method: 'GET' as const, path: '/support/channel-boot' },
];

export function registerExtensionRoutes(): void {
  registerSupabaseRoute('POST', '/search/ai', async ({ client, body }) => {
    const { data, error } = await client.functions.invoke('ai-property-search', {
      body: body as Record<string, unknown>,
    });

    if (error) {
      throw await parseEdgeFunctionError(error, 'API_ERROR', 'Unable to run smart search.');
    }

    const inlineError = extractInlineFunctionError(data);
    if (inlineError) {
      throw new AppError('API_ERROR', inlineError);
    }

    return data;
  });

  registerSupabaseRoute('GET', '/support/channel-boot', async ({ client }) => {
    const { data, error } = await client.functions.invoke('channel-boot', {
      method: 'GET',
    });

    assertNoSupabaseError(error, 'Unable to initialize chat support');
    return data;
  });
}
