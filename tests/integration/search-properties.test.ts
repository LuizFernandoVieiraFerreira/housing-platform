import { describe, expect, it } from 'vitest';

import {
  createAnonClient,
  HONGDAE_PROPERTY_ID,
  isSupabaseReachable,
  MAPO_WORKSTATION_PROPERTY_ID,
  SNU_MICRO_PROPERTY_ID,
  YEOUIDO_FINANCE_PROPERTY_ID,
} from './helpers/supabase';

const integrationEnabled = await isSupabaseReachable();

type SearchRow = {
  id: string;
  slug: string;
  total_count: number;
};

describe.skipIf(!integrationEnabled)('search_properties_hybrid filters', () => {
  it('returns all published listings with empty filters via search_properties wrapper', async () => {
    const anon = createAnonClient();

    const { data, error } = await anon.rpc('search_properties', {
      p_filters: {},
      p_limit: 100,
      p_offset: 0,
    });

    expect(error).toBeNull();
    expect((data as SearchRow[] | null)?.[0]?.total_count).toBe(42);
  });

  it('filters by required amenity slugs', async () => {
    const anon = createAnonClient();

    const { data, error } = await anon.rpc('search_properties_hybrid', {
      p_filters: {
        amenity_slugs: ['washing-machine'],
      },
      p_limit: 100,
      p_offset: 0,
    });

    expect(error).toBeNull();

    const rows = (data ?? []) as SearchRow[];
    expect(rows.length).toBeGreaterThan(0);
    expect(rows[0]?.total_count).toBeGreaterThan(0);
    expect(rows.every((row) => row.slug.length > 0)).toBe(true);

    const { data: withoutWasher, error: withoutWasherError } = await anon.rpc(
      'search_properties_hybrid',
      {
        p_filters: {
          amenity_slugs: ['washing-machine', 'parking'],
        },
        p_limit: 100,
        p_offset: 0,
      },
    );

    expect(withoutWasherError).toBeNull();
    expect((withoutWasher as SearchRow[] | null)?.length ?? 0).toBeLessThan(rows.length);
  });

  it('filters by max_station_walk_min', async () => {
    const anon = createAnonClient();

    const { data: nearStation, error } = await anon.rpc('search_properties_hybrid', {
      p_filters: {
        max_station_walk_min: 5,
      },
      p_limit: 100,
      p_offset: 0,
    });

    expect(error).toBeNull();

    const nearRows = (nearStation ?? []) as SearchRow[];
    expect(nearRows.some((row) => row.id === MAPO_WORKSTATION_PROPERTY_ID)).toBe(true);
    expect(nearRows.some((row) => row.id === SNU_MICRO_PROPERTY_ID)).toBe(false);

    const { data: allPublished } = await anon.rpc('search_properties_hybrid', {
      p_filters: {},
      p_limit: 100,
      p_offset: 0,
    });

    expect(nearRows[0]?.total_count ?? 0).toBeLessThan(
      ((allPublished ?? []) as SearchRow[])[0]?.total_count ?? 0,
    );
  });

  it('combines amenity and station walk filters', async () => {
    const anon = createAnonClient();

    const { data, error } = await anon.rpc('search_properties_hybrid', {
      p_filters: {
        amenity_slugs: ['washing-machine'],
        max_station_walk_min: 5,
      },
      p_limit: 100,
      p_offset: 0,
    });

    expect(error).toBeNull();

    const rows = (data ?? []) as SearchRow[];
    expect(rows.some((row) => row.id === MAPO_WORKSTATION_PROPERTY_ID)).toBe(true);
    expect(rows.some((row) => row.id === YEOUIDO_FINANCE_PROPERTY_ID)).toBe(false);
  });

  it('excludes property ids from results', async () => {
    const anon = createAnonClient();

    const { data: baseline } = await anon.rpc('search_properties_hybrid', {
      p_filters: {},
      p_limit: 100,
      p_offset: 0,
    });

    const baselineCount = ((baseline ?? []) as SearchRow[])[0]?.total_count ?? 0;

    const { data, error } = await anon.rpc('search_properties_hybrid', {
      p_filters: {
        exclude_property_ids: [HONGDAE_PROPERTY_ID],
      },
      p_limit: 100,
      p_offset: 0,
    });

    expect(error).toBeNull();

    const rows = (data ?? []) as SearchRow[];
    expect(rows.some((row) => row.id === HONGDAE_PROPERTY_ID)).toBe(false);
    expect(rows[0]?.total_count).toBe(baselineCount - 1);
  });

  it('exposes location aliases to anonymous users', async () => {
    const anon = createAnonClient();

    const { data, error } = await anon
      .from('location_aliases')
      .select('alias, district, center_lat, center_lng')
      .eq('alias', 'Hongdae')
      .maybeSingle();

    expect(error).toBeNull();
    expect(data?.district).toBe('Mapo-gu');
    expect(data?.center_lat).toBeCloseTo(37.5563, 3);
    expect(data?.center_lng).toBeCloseTo(126.922, 3);
  });
});
