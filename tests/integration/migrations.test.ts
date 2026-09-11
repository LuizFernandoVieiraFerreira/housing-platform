import { describe, expect, it } from 'vitest';

import { createServiceClient, isSupabaseReachable } from './helpers/supabase';

const integrationEnabled = await isSupabaseReachable();

describe.skipIf(!integrationEnabled)('Migration smoke checks', () => {
  it('includes core marketplace tables', async () => {
    const service = createServiceClient();

    const tables = [
      'profiles',
      'properties',
      'rooms',
      'bookings',
      'payments',
      'housing_requests',
      'audit_logs',
      'api_rate_limits',
      'location_aliases',
      'property_search_embeddings',
    ];

    for (const table of tables) {
      const { error } = await service.from(table).select('*', { count: 'exact', head: true });
      expect(error).toBeNull();
    }
  });
});
