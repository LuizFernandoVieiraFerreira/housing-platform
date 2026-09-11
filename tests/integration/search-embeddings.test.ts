import { afterAll, describe, expect, it } from 'vitest';

import {
  createAnonClient,
  createServiceClient,
  HONGDAE_PROPERTY_ID,
  isSupabaseReachable,
  MAPO_WORKSTATION_PROPERTY_ID,
  unitEmbeddingVector,
  YEOUIDO_FINANCE_PROPERTY_ID,
} from './helpers/supabase';

const integrationEnabled = await isSupabaseReachable();

type SearchRow = {
  id: string;
  total_count: number;
};

describe.skipIf(!integrationEnabled)('property search embeddings', () => {
  const service = createServiceClient();

  afterAll(async () => {
    await service
      .from('property_search_embeddings')
      .delete()
      .in('property_id', [
        HONGDAE_PROPERTY_ID,
        MAPO_WORKSTATION_PROPERTY_ID,
        YEOUIDO_FINANCE_PROPERTY_ID,
      ]);
  });

  it('builds a deterministic search document for a published property', async () => {
    const { data, error } = await service.rpc('build_property_search_document', {
      p_property_id: HONGDAE_PROPERTY_ID,
    });

    expect(error).toBeNull();
    expect(data).toContain('Bright studio near Hongdae');
    expect(data).toContain('Amenities:');
    expect(data).toContain('Min stay nights:');
  });

  it('ranks listings by query embedding similarity after SQL filters', async () => {
    const { error: upsertError } = await service.from('property_search_embeddings').upsert([
      {
        property_id: MAPO_WORKSTATION_PROPERTY_ID,
        content: 'Mapo workstation test document',
        content_hash: 'mapo-test-hash',
        embedding: unitEmbeddingVector(0),
      },
      {
        property_id: YEOUIDO_FINANCE_PROPERTY_ID,
        content: 'Yeouido finance test document',
        content_hash: 'yeouido-test-hash',
        embedding: unitEmbeddingVector(1),
      },
    ]);

    expect(upsertError).toBeNull();

    const anon = createAnonClient();

    const { data, error } = await anon.rpc('search_properties_hybrid', {
      p_filters: {
        amenity_slugs: ['wifi', 'desk'],
      },
      p_limit: 10,
      p_offset: 0,
      p_query_embedding: unitEmbeddingVector(0),
      p_match_threshold: 0.5,
    });

    expect(error).toBeNull();

    const rows = (data ?? []) as SearchRow[];
    expect(rows.length).toBeGreaterThan(0);
    expect(rows[0]?.id).toBe(MAPO_WORKSTATION_PROPERTY_ID);
  });

  it('supports reference_property_id similarity ranking', async () => {
    const { error: upsertError } = await service.from('property_search_embeddings').upsert([
      {
        property_id: MAPO_WORKSTATION_PROPERTY_ID,
        content: 'Mapo reference document',
        content_hash: 'mapo-reference-hash',
        embedding: unitEmbeddingVector(0),
      },
      {
        property_id: HONGDAE_PROPERTY_ID,
        content: 'Hongdae similar document',
        content_hash: 'hongdae-similar-hash',
        embedding: unitEmbeddingVector(0),
      },
    ]);

    expect(upsertError).toBeNull();

    const anon = createAnonClient();

    const { data, error } = await anon.rpc('search_properties_hybrid', {
      p_filters: {
        reference_property_id: MAPO_WORKSTATION_PROPERTY_ID,
        exclude_property_ids: [MAPO_WORKSTATION_PROPERTY_ID],
        amenity_slugs: ['wifi'],
      },
      p_limit: 10,
      p_offset: 0,
      p_match_threshold: 0.5,
    });

    expect(error).toBeNull();

    const rows = (data ?? []) as SearchRow[];
    expect(rows.some((row) => row.id === MAPO_WORKSTATION_PROPERTY_ID)).toBe(false);
    expect(rows.some((row) => row.id === HONGDAE_PROPERTY_ID)).toBe(true);
  });
});
