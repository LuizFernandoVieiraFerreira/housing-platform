import { describe, expect, it } from 'vitest';

import {
  createAnonClient,
  getFunctionsUrl,
  getServiceRoleKey,
  HONGDAE_PROPERTY_ID,
  isSupabaseReachable,
} from './helpers/supabase';

const integrationEnabled = await isSupabaseReachable();

describe.skipIf(!integrationEnabled)('ai-property-search function', () => {
  it('parses a structured studio query in dev mock mode', async () => {
    const anon = createAnonClient();
    const {
      data: { session },
    } = await anon.auth.getSession();

    const response = await fetch(`${getFunctionsUrl()}/ai-property-search`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session?.access_token ?? getServiceRoleKey()}`,
        apikey: getServiceRoleKey(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: 'I need a studio in Hongdae for 2 months under 1.2 million won per month',
        limit: 20,
      }),
    });

    expect(response.status).toBe(200);

    const payload = (await response.json()) as {
      totalCount: number;
      interpretedFilters: {
        propertyType?: string;
        priceMax?: number;
        query?: string;
      };
      items: Array<{ id: string }>;
    };

    expect(payload.totalCount).toBeGreaterThan(0);
    expect(payload.interpretedFilters.propertyType).toBe('studio');
    expect(payload.interpretedFilters.priceMax).toBe(1_200_000);
    expect(payload.interpretedFilters.query?.toLowerCase()).toContain('hongdae');
    expect(payload.items.length).toBeGreaterThan(0);
  });

  it('supports similar-but-cheaper searches from a reference property', async () => {
    const anon = createAnonClient();
    const {
      data: { session },
    } = await anon.auth.getSession();

    const response = await fetch(`${getFunctionsUrl()}/ai-property-search`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session?.access_token ?? getServiceRoleKey()}`,
        apikey: getServiceRoleKey(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: 'similar but cheaper',
        referencePropertyId: HONGDAE_PROPERTY_ID,
        limit: 10,
      }),
    });

    expect(response.status).toBe(200);

    const payload = (await response.json()) as {
      totalCount: number;
      interpretedFilters: {
        excludePropertyIds?: string[];
        priceMax?: number;
      };
      items: Array<{ id: string; monthlyPriceMin: number }>;
    };

    expect(payload.interpretedFilters.excludePropertyIds).toContain(HONGDAE_PROPERTY_ID);
    expect(payload.items.every((item) => item.id !== HONGDAE_PROPERTY_ID)).toBe(true);

    if (payload.interpretedFilters.priceMax != null) {
      expect(
        payload.items.every((item) => item.monthlyPriceMin <= payload.interpretedFilters.priceMax!),
      ).toBe(true);
    }
  });
});
