import { registerApiRoute } from '@/shared/api/client';
import { wrapSupabaseError } from '@/shared/lib/errors';

import type { FeaturedPropertyCard, FeaturedPropertyRow } from '../model';
import { mapFeaturedPropertyRow } from './mappers';

const fetchFeaturedPropertiesRequest = registerApiRoute<FeaturedPropertyCard[]>(
  'properties',
  'GET',
  '/properties/featured',
  async ({ client }) => {
    const { data, error } = await client
      .from('properties')
      .select(
        `
        id,
        title,
        slug,
        property_type,
        district,
        nearest_station_name,
        monthly_price_min,
        tags,
        property_images (
          storage_path,
          alt_text,
          is_cover,
          sort_order
        )
      `,
      )
      .eq('status', 'published')
      .eq('is_featured', true)
      .order('published_at', { ascending: false })
      .limit(8);

    if (error) {
      throw wrapSupabaseError(error, 'Unable to load featured properties');
    }

    return ((data ?? []) as FeaturedPropertyRow[])
      .map(mapFeaturedPropertyRow)
      .filter((property): property is FeaturedPropertyCard => property !== null);
  },
);

export function fetchFeaturedProperties(): Promise<FeaturedPropertyCard[]> {
  return fetchFeaturedPropertiesRequest({ anonymous: true });
}

const submitPropertyForReviewRequest = registerApiRoute<unknown>(
  'properties',
  'POST',
  '/properties/:id/submit-review',
  async ({ client, params }) => {
    const { data, error } = await client.rpc('submit_property_for_review', {
      p_property_id: params.id,
    });

    if (error) {
      throw wrapSupabaseError(error, 'Unable to submit property for review');
    }

    return data;
  },
);

export function submitPropertyForReview(propertyId: string) {
  return submitPropertyForReviewRequest({ params: { id: propertyId } });
}
