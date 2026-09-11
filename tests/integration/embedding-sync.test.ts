import { describe, expect, it } from 'vitest';

import {
  createServiceClient,
  HONGDAE_PROPERTY_ID,
  isSupabaseReachable,
} from './helpers/supabase';

const integrationEnabled = await isSupabaseReachable();

describe.skipIf(!integrationEnabled)('property embedding sync queue', () => {
  it('tracks embedding sync status for published listings after seed', async () => {
    const service = createServiceClient();

    const { data, error } = await service
      .from('properties')
      .select('id, embedding_sync_status')
      .eq('id', HONGDAE_PROPERTY_ID)
      .maybeSingle();

    expect(error).toBeNull();
    expect(['pending', 'synced']).toContain(data?.embedding_sync_status);
  });

  it('marks a published listing pending when searchable content changes', async () => {
    const service = createServiceClient();

    const { data: property, error: loadError } = await service
      .from('properties')
      .select('id, title, embedding_sync_status')
      .eq('id', HONGDAE_PROPERTY_ID)
      .maybeSingle();

    expect(loadError).toBeNull();
    expect(property).not.toBeNull();

    const nextTitle =
      property!.title === 'Bright studio near Hongdae'
        ? 'Bright studio near Hongdae (updated)'
        : 'Bright studio near Hongdae';

    const { error: updateError } = await service
      .from('properties')
      .update({ title: nextTitle })
      .eq('id', HONGDAE_PROPERTY_ID);

    expect(updateError).toBeNull();

    const { data, error } = await service
      .from('properties')
      .select('embedding_sync_status')
      .eq('id', HONGDAE_PROPERTY_ID)
      .maybeSingle();

    expect(error).toBeNull();
    expect(data?.embedding_sync_status).toBe('pending');
  });

  it('exposes a retry RPC for pending embedding syncs', async () => {
    const service = createServiceClient();

    const { data, error } = await service.rpc('retry_pending_property_embedding_syncs', {
      p_limit: 1,
    });

    expect(error).toBeNull();
    expect(typeof data).toBe('number');
    expect(data).toBeGreaterThanOrEqual(0);
  });
});
