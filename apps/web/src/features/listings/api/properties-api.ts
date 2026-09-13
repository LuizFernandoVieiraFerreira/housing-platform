import { supabase } from '@/shared/api/supabase';
import { wrapSupabaseError } from '@/shared/lib/errors';

import type { FeaturedPropertyCard, FeaturedPropertyRow } from '../model';
import { mapFeaturedPropertyRow } from './mappers';

export async function fetchFeaturedProperties(): Promise<FeaturedPropertyCard[]> {
  const { data, error } = await supabase
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
}

export async function submitPropertyForReview(propertyId: string) {
  const { data, error } = await supabase.rpc('submit_property_for_review', {
    p_property_id: propertyId,
  });

  if (error) {
    throw wrapSupabaseError(error, 'Unable to submit property for review');
  }

  return data;
}
