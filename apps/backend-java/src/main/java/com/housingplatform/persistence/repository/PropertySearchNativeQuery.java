package com.housingplatform.persistence.repository;

import com.housingplatform.persistence.enums.AccommodationType;
import com.housingplatform.persistence.repository.PropertyRepositoryCustom.SearchPropertyRow;
import com.housingplatform.properties.model.PropertySearchCriteria;
import jakarta.persistence.EntityManager;
import jakarta.persistence.Query;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

final class PropertySearchNativeQuery {

  private static final String SEARCH_SQL =
      """
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
            WHEN :centerLat IS NOT NULL AND :centerLng IS NOT NULL AND p.location IS NOT NULL THEN
              extensions.st_distance(
                p.location,
                extensions.st_setsrid(
                  extensions.st_makepoint(:centerLng, :centerLat),
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
            :textQuery IS NULL
            OR p.title ILIKE '%' || :textQuery || '%'
            OR p.district ILIKE '%' || :textQuery || '%'
            OR COALESCE(p.nearest_station_name, '') ILIKE '%' || :textQuery || '%'
            OR EXISTS (
              SELECT 1 FROM unnest(p.tags) tag WHERE tag ILIKE '%' || :textQuery || '%'
            )
          )
          AND (:propertyType IS NULL OR p.property_type = CAST(:propertyType AS accommodation_type))
          AND (:priceMin IS NULL OR p.monthly_price_min >= :priceMin)
          AND (:priceMax IS NULL OR p.monthly_price_min <= :priceMax)
          AND (:stayNights IS NULL OR p.min_stay_nights <= :stayNights)
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
                  :checkIn IS NULL
                  OR r.available_from IS NULL
                  OR r.available_from <= CAST(:checkIn AS date)
                )
            )
          )
          AND (
            :hasBounds = FALSE
            OR extensions.st_within(
              p.location::extensions.geometry,
              extensions.st_makeenvelope(:west, :south, :east, :north, 4326)
            )
          )
          AND (
            :maxStationWalkMin IS NULL
            OR (
              p.nearest_station_walk_min IS NOT NULL
              AND p.nearest_station_walk_min <= :maxStationWalkMin
            )
          )
          AND (
            :amenitySlugs IS NULL
            OR NOT EXISTS (
              SELECT 1
              FROM unnest(CAST(:amenitySlugs AS text[])) required_slug
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
            :excludePropertyIds IS NULL
            OR NOT (p.id = ANY (CAST(:excludePropertyIds AS uuid[])))
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
      """;

  private PropertySearchNativeQuery() {}

  @SuppressWarnings("unchecked")
  static List<SearchPropertyRow> execute(
      EntityManager entityManager, PropertySearchCriteria criteria, int limit, int offset) {
    Query query =
        entityManager
            .createNativeQuery(SEARCH_SQL)
            .setParameter("textQuery", criteria.textQuery())
            .setParameter(
                "propertyType",
                criteria.propertyType() == null ? null : criteria.propertyType().dbValue())
            .setParameter("priceMin", criteria.priceMin())
            .setParameter("priceMax", criteria.priceMax())
            .setParameter("guests", criteria.guests())
            .setParameter("stayNights", criteria.stayNights())
            .setParameter("checkIn", criteria.checkIn())
            .setParameter("sort", criteria.sort().name())
            .setParameter("centerLat", criteria.centerLat())
            .setParameter("centerLng", criteria.centerLng())
            .setParameter("north", criteria.north())
            .setParameter("south", criteria.south())
            .setParameter("east", criteria.east())
            .setParameter("west", criteria.west())
            .setParameter("hasBounds", criteria.hasBounds())
            .setParameter("maxStationWalkMin", criteria.maxStationWalkMin())
            .setParameter(
                "amenitySlugs",
                toStringArray(criteria.amenitySlugs()))
            .setParameter(
                "excludePropertyIds",
                toUuidArray(criteria.excludePropertyIds()))
            .setParameter("limit", limit)
            .setParameter("offset", offset);

    List<Object[]> rows = query.getResultList();
    List<SearchPropertyRow> results = new ArrayList<>(rows.size());
    for (Object[] row : rows) {
      results.add(mapRow(row));
    }
    return results;
  }

  private static SearchPropertyRow mapRow(Object[] row) {
    return new SearchPropertyRow(
        (UUID) row[0],
        (String) row[1],
        (String) row[2],
        AccommodationType.fromDbValue((String) row[3]),
        (String) row[4],
        (String) row[5],
        ((Number) row[6]).intValue(),
        toStringList(row[7]),
        (String) row[8],
        (String) row[9],
        ((Number) row[10]).doubleValue(),
        ((Number) row[11]).doubleValue(),
        row[12] == null ? null : ((Number) row[12]).doubleValue(),
        ((Number) row[13]).intValue());
  }

  private static String[] toStringArray(List<String> values) {
    if (values == null || values.isEmpty()) {
      return null;
    }
    return values.toArray(String[]::new);
  }

  private static UUID[] toUuidArray(List<UUID> values) {
    if (values == null || values.isEmpty()) {
      return null;
    }
    return values.toArray(UUID[]::new);
  }

  @SuppressWarnings("unchecked")
  private static List<String> toStringList(Object value) {
    if (value == null) {
      return List.of();
    }
    if (value instanceof String[] array) {
      return List.of(array);
    }
    if (value instanceof Object[] array) {
      List<String> tags = new ArrayList<>();
      for (Object item : array) {
        if (item != null) {
          tags.add(item.toString());
        }
      }
      return tags;
    }
    return List.of();
  }
}
