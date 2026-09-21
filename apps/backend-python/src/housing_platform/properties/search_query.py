import uuid
from typing import Any

from sqlalchemy import text
from sqlalchemy.orm import Session

from housing_platform.properties.search_criteria import PropertySearchCriteria, SearchPropertyRow

SEARCH_SQL = """
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
      WHEN :center_lat IS NOT NULL AND :center_lng IS NOT NULL AND p.location IS NOT NULL THEN
        extensions.st_distance(
          p.location,
          extensions.st_setsrid(
            extensions.st_makepoint(:center_lng, :center_lat),
            4326
          )::extensions.geography
        )
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
      :text_query IS NULL
      OR p.title ILIKE '%' || :text_query || '%'
      OR p.district ILIKE '%' || :text_query || '%'
      OR COALESCE(p.nearest_station_name, '') ILIKE '%' || :text_query || '%'
      OR EXISTS (
        SELECT 1 FROM unnest(p.tags) tag WHERE tag ILIKE '%' || :text_query || '%'
      )
    )
    AND (:property_type IS NULL OR p.property_type = CAST(:property_type AS accommodation_type))
    AND (:price_min IS NULL OR p.monthly_price_min >= :price_min)
    AND (:price_max IS NULL OR p.monthly_price_min <= :price_max)
    AND (:stay_nights IS NULL OR p.min_stay_nights <= :stay_nights)
    AND (
      :guests IS NULL
      OR EXISTS (
        SELECT 1
        FROM public.rooms r
        WHERE r.property_id = p.id
          AND r.deleted_at IS NULL
          AND r.status = 'available'
          AND r.max_occupancy >= :guests
          AND (
            :check_in IS NULL
            OR r.available_from IS NULL
            OR r.available_from <= CAST(:check_in AS date)
          )
      )
    )
    AND (
      :has_bounds = FALSE
      OR extensions.st_within(
        p.location::extensions.geometry,
        extensions.st_makeenvelope(:west, :south, :east, :north, 4326)
      )
    )
    AND (
      :max_station_walk_min IS NULL
      OR (
        p.nearest_station_walk_min IS NOT NULL
        AND p.nearest_station_walk_min <= :max_station_walk_min
      )
    )
    AND (
      :amenity_slugs IS NULL
      OR NOT EXISTS (
        SELECT 1
        FROM unnest(CAST(:amenity_slugs AS text[])) required_slug
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
      :exclude_property_ids IS NULL
      OR NOT (p.id = ANY (CAST(:exclude_property_ids AS uuid[])))
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
  CASE WHEN :sort = 'price_asc' THEN filtered.monthly_price_min END ASC NULLS LAST,
  CASE WHEN :sort = 'price_desc' THEN filtered.monthly_price_min END DESC NULLS LAST,
  CASE WHEN :sort = 'distance' THEN filtered.distance_meters END ASC NULLS LAST,
  filtered.is_featured DESC,
  filtered.published_at DESC NULLS LAST,
  filtered.title ASC
LIMIT :limit OFFSET :offset
"""


def execute_property_search(
    db: Session,
    criteria: PropertySearchCriteria,
    *,
    limit: int,
    offset: int,
) -> list[SearchPropertyRow]:
    params = _search_params(criteria, limit=limit, offset=offset)
    rows = db.execute(text(SEARCH_SQL), params).mappings()
    return [_map_row(row) for row in rows]


def _search_params(
    criteria: PropertySearchCriteria,
    *,
    limit: int,
    offset: int,
) -> dict[str, Any]:
    return {
        "text_query": criteria.text_query,
        "property_type": criteria.property_type,
        "price_min": criteria.price_min,
        "price_max": criteria.price_max,
        "guests": criteria.guests,
        "stay_nights": criteria.stay_nights,
        "check_in": criteria.check_in,
        "sort": criteria.sort.value,
        "center_lat": criteria.center_lat,
        "center_lng": criteria.center_lng,
        "north": criteria.north,
        "south": criteria.south,
        "east": criteria.east,
        "west": criteria.west,
        "has_bounds": criteria.has_bounds,
        "max_station_walk_min": criteria.max_station_walk_min,
        "amenity_slugs": criteria.amenity_slugs,
        "exclude_property_ids": _uuid_array(criteria.exclude_property_ids),
        "limit": limit,
        "offset": offset,
    }


def _uuid_array(values: list[uuid.UUID] | None) -> list[uuid.UUID] | None:
    if not values:
        return None
    return values


def _map_row(row: Any) -> SearchPropertyRow:
    return SearchPropertyRow(
        id=row["id"],
        title=row["title"],
        slug=row["slug"],
        property_type=row["property_type"],
        district=row["district"],
        nearest_station_name=row["nearest_station_name"],
        monthly_price_min=row["monthly_price_min"],
        tags=_to_string_list(row["tags"]),
        cover_storage_path=row["cover_storage_path"],
        cover_alt_text=row["cover_alt_text"],
        latitude=float(row["latitude"]),
        longitude=float(row["longitude"]),
        distance_meters=float(row["distance_meters"]) if row["distance_meters"] is not None else None,
        total_count=int(row["total_count"]),
    )


def _to_string_list(value: Any) -> list[str] | None:
    if value is None:
        return None
    if isinstance(value, list):
        return [str(item) for item in value if item is not None]
    return [str(value)]
