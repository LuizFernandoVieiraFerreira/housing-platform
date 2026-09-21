import { Prisma } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';
import type {
  PropertySearchCriteria,
  SearchPropertyRow,
} from './property-search.criteria';

interface RawSearchRow {
  id: string;
  title: string;
  slug: string;
  property_type: string;
  district: string;
  nearest_station_name: string | null;
  monthly_price_min: number;
  tags: string[] | null;
  cover_storage_path: string | null;
  cover_alt_text: string | null;
  latitude: number;
  longitude: number;
  distance_meters: number | null;
  total_count: bigint | number;
}

export async function executePropertySearch(
  prisma: PrismaService,
  criteria: PropertySearchCriteria,
  limit: number,
  offset: number,
): Promise<SearchPropertyRow[]> {
  const rows = await prisma.$queryRaw<RawSearchRow[]>(
    buildSearchQuery(criteria, limit, offset),
  );
  return rows.map(mapSearchRow);
}

function buildSearchQuery(
  criteria: PropertySearchCriteria,
  limit: number,
  offset: number,
): Prisma.Sql {
  const centerLat = criteria.centerLat;
  const centerLng = criteria.centerLng;
  const hasCenter = centerLat != null && centerLng != null;

  const distanceExpr = hasCenter
    ? Prisma.sql`
        extensions.st_distance(
          p.location,
          extensions.st_setsrid(
            extensions.st_makepoint(${centerLng!}, ${centerLat!}),
            4326
          )::extensions.geography
        )`
    : Prisma.sql`NULL`;

  const checkIn = criteria.checkIn;

  return Prisma.sql`
    WITH filtered AS (
      SELECT
        p.id,
        p.title,
        p.slug,
        p.property_type,
        p.district,
        p.nearest_station_name,
        p.monthly_price_min,
        p.tags,
        cover.storage_path AS cover_storage_path,
        cover.alt_text AS cover_alt_text,
        extensions.st_y(p.location::extensions.geometry) AS latitude,
        extensions.st_x(p.location::extensions.geometry) AS longitude,
        CASE
          WHEN ${hasCenter} AND p.location IS NOT NULL THEN ${distanceExpr}
          ELSE NULL
        END AS distance_meters,
        p.is_featured,
        p.published_at
      FROM public.properties p
      LEFT JOIN LATERAL (
        SELECT pi.storage_path, pi.alt_text
        FROM public.property_images pi
        WHERE pi.property_id = p.id
        ORDER BY pi.is_cover DESC, pi.sort_order ASC, pi.created_at ASC
        LIMIT 1
      ) cover ON TRUE
      WHERE p.deleted_at IS NULL
        AND p.status = 'published'
        AND p.monthly_price_min IS NOT NULL
        AND p.location IS NOT NULL
        AND (
          ${criteria.textQuery}::text IS NULL
          OR p.title ILIKE '%' || ${criteria.textQuery} || '%'
          OR p.district ILIKE '%' || ${criteria.textQuery} || '%'
          OR COALESCE(p.nearest_station_name, '') ILIKE '%' || ${criteria.textQuery} || '%'
          OR EXISTS (
            SELECT 1 FROM unnest(p.tags) tag WHERE tag ILIKE '%' || ${criteria.textQuery} || '%'
          )
        )
        AND (
          ${criteria.propertyType}::text IS NULL
          OR p.property_type = CAST(${criteria.propertyType} AS accommodation_type)
        )
        AND (${criteria.priceMin}::int IS NULL OR p.monthly_price_min >= ${criteria.priceMin})
        AND (${criteria.priceMax}::int IS NULL OR p.monthly_price_min <= ${criteria.priceMax})
        AND (${criteria.stayNights}::int IS NULL OR p.min_stay_nights <= ${criteria.stayNights})
        AND (
          ${criteria.guests}::int IS NULL
          OR EXISTS (
            SELECT 1
            FROM public.rooms r
            WHERE r.property_id = p.id
              AND r.deleted_at IS NULL
              AND r.status = 'available'
              AND r.max_occupancy >= ${criteria.guests}
              AND (
                ${checkIn}::text IS NULL
                OR r.available_from IS NULL
                OR r.available_from <= CAST(${checkIn} AS date)
              )
          )
        )
        AND (
          ${criteria.hasBounds} = FALSE
          OR extensions.st_within(
            p.location::extensions.geometry,
            extensions.st_makeenvelope(
              ${criteria.west},
              ${criteria.south},
              ${criteria.east},
              ${criteria.north},
              4326
            )
          )
        )
        AND (
          ${criteria.maxStationWalkMin}::int IS NULL
          OR (
            p.nearest_station_walk_min IS NOT NULL
            AND p.nearest_station_walk_min <= ${criteria.maxStationWalkMin}
          )
        )
        AND (
          ${criteria.amenitySlugs}::text[] IS NULL
          OR NOT EXISTS (
            SELECT 1
            FROM unnest(${criteria.amenitySlugs}::text[]) required_slug
            WHERE NOT EXISTS (
              SELECT 1
              FROM public.property_amenities pa
              INNER JOIN public.amenities a ON a.id = pa.amenity_id
              WHERE pa.property_id = p.id
                AND a.slug = required_slug
            )
          )
        )
        AND (
          ${criteria.excludePropertyIds}::uuid[] IS NULL
          OR NOT (p.id = ANY (${criteria.excludePropertyIds}::uuid[]))
        )
    )
    SELECT
      filtered.id,
      filtered.title,
      filtered.slug,
      filtered.property_type,
      filtered.district,
      filtered.nearest_station_name,
      filtered.monthly_price_min,
      filtered.tags,
      filtered.cover_storage_path,
      filtered.cover_alt_text,
      filtered.latitude,
      filtered.longitude,
      filtered.distance_meters,
      count(*) OVER () AS total_count
    FROM filtered
    ORDER BY
      CASE WHEN ${criteria.sort} = 'price_asc' THEN filtered.monthly_price_min END ASC NULLS LAST,
      CASE WHEN ${criteria.sort} = 'price_desc' THEN filtered.monthly_price_min END DESC NULLS LAST,
      CASE WHEN ${criteria.sort} = 'distance' THEN filtered.distance_meters END ASC NULLS LAST,
      filtered.is_featured DESC,
      filtered.published_at DESC NULLS LAST,
      filtered.title ASC
    LIMIT ${limit} OFFSET ${offset}
  `;
}

function mapSearchRow(row: RawSearchRow): SearchPropertyRow {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    propertyType: row.property_type,
    district: row.district,
    nearestStationName: row.nearest_station_name,
    monthlyPriceMin: row.monthly_price_min,
    tags: toStringList(row.tags),
    coverStoragePath: row.cover_storage_path,
    coverAltText: row.cover_alt_text,
    latitude: Number(row.latitude),
    longitude: Number(row.longitude),
    distanceMeters:
      row.distance_meters != null ? Number(row.distance_meters) : null,
    totalCount: Number(row.total_count),
  };
}

function toStringList(value: string[] | null): string[] | null {
  if (value == null) {
    return null;
  }
  return value.filter((item) => item != null).map(String);
}
