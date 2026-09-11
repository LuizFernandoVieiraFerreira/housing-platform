import type { FeaturedPropertyCard } from '@housing-platform/types';

import { supabase } from '@/shared/api/supabase';

import { resolvePropertyImageUrl } from '@/features/listings/lib/image-url';

type FeaturedPropertyRow = {
  id: string;
  title: string;
  slug: string;
  property_type: FeaturedPropertyCard['propertyType'];
  district: string;
  nearest_station_name: string | null;
  monthly_price_min: number | null;
  tags: string[] | null;
  property_images: Array<{
    storage_path: string;
    alt_text: string | null;
    is_cover: boolean;
    sort_order: number;
  }> | null;
};

function mapFeaturedProperty(row: FeaturedPropertyRow): FeaturedPropertyCard | null {
  if (row.monthly_price_min == null) {
    return null;
  }

  const images = row.property_images ?? [];
  const coverImage =
    images.find((image) => image.is_cover) ??
    [...images].sort((left, right) => left.sort_order - right.sort_order)[0];

  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    propertyType: row.property_type,
    district: row.district,
    nearestStationName: row.nearest_station_name,
    monthlyPriceMin: row.monthly_price_min,
    coverImageUrl: coverImage ? resolvePropertyImageUrl(coverImage.storage_path) : null,
    coverImageAlt: coverImage?.alt_text ?? null,
    tags: row.tags ?? [],
  };
}

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
    throw error;
  }

  return ((data ?? []) as FeaturedPropertyRow[])
    .map(mapFeaturedProperty)
    .filter((property): property is FeaturedPropertyCard => property !== null);
}

export async function publishProperty(propertyId: string) {
  const { data, error } = await supabase.rpc('publish_property', {
    p_property_id: propertyId,
  });

  if (error) {
    throw error;
  }

  return data;
}

export async function rejectPropertyReview(propertyId: string) {
  const { data, error } = await supabase.rpc('reject_property_review', {
    p_property_id: propertyId,
  });

  if (error) {
    throw error;
  }

  return data;
}

export async function submitPropertyForReview(propertyId: string) {
  const { data, error } = await supabase.rpc('submit_property_for_review', {
    p_property_id: propertyId,
  });

  if (error) {
    throw error;
  }

  return data;
}
