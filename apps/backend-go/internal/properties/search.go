package properties

import (
	"context"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

const searchSQL = `
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
      WHEN $11 IS NOT NULL AND $12 IS NOT NULL AND p.location IS NOT NULL THEN
        extensions.st_distance(
          p.location,
          extensions.st_setsrid(
            extensions.st_makepoint($12, $11),
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
      $1 IS NULL
      OR p.title ILIKE '%' || $1 || '%'
      OR p.district ILIKE '%' || $1 || '%'
      OR COALESCE(p.nearest_station_name, '') ILIKE '%' || $1 || '%'
      OR EXISTS (
        SELECT 1 FROM unnest(p.tags) tag WHERE tag ILIKE '%' || $1 || '%'
      )
    )
    AND ($2 IS NULL OR p.property_type = CAST($2 AS accommodation_type))
    AND ($3 IS NULL OR p.monthly_price_min >= $3)
    AND ($4 IS NULL OR p.monthly_price_min <= $4)
    AND ($5 IS NULL OR p.min_stay_nights <= $5)
    AND (
      $6 IS NULL
      OR EXISTS (
        SELECT 1
        FROM public.rooms r
        WHERE r.property_id = p.id
          AND r.deleted_at IS NULL
          AND r.status = 'available'
          AND r.max_occupancy >= $6
          AND (
            $7 IS NULL
            OR r.available_from IS NULL
            OR r.available_from <= CAST($7 AS date)
          )
      )
    )
    AND (
      $8 = FALSE
      OR extensions.st_within(
        p.location::extensions.geometry,
        extensions.st_makeenvelope($9, $10, $13, $14, 4326)
      )
    )
    AND (
      $15 IS NULL
      OR (
        p.nearest_station_walk_min IS NOT NULL
        AND p.nearest_station_walk_min <= $15
      )
    )
    AND (
      $16 IS NULL
      OR NOT EXISTS (
        SELECT 1
        FROM unnest(CAST($16 AS text[])) required_slug
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
      $17 IS NULL
      OR NOT (p.id = ANY (CAST($17 AS uuid[])))
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
  CASE WHEN $18 = 'price_asc' THEN filtered.monthly_price_min END ASC NULLS LAST,
  CASE WHEN $18 = 'price_desc' THEN filtered.monthly_price_min END DESC NULLS LAST,
  CASE WHEN $18 = 'distance' THEN filtered.distance_meters END ASC NULLS LAST,
  filtered.is_featured DESC,
  filtered.published_at DESC NULLS LAST,
  filtered.title ASC
LIMIT $19 OFFSET $20
`

type SearchPropertyRow struct {
	ID                 uuid.UUID
	Title              string
	Slug               string
	PropertyType       string
	District           string
	NearestStationName *string
	MonthlyPriceMin    int
	Tags               []string
	CoverStoragePath   *string
	CoverAltText       *string
	Latitude           float64
	Longitude          float64
	DistanceMeters     *float64
	TotalCount         int
}

type searchCriteria struct {
	textQuery          *string
	propertyType       *string
	priceMin           *int
	priceMax           *int
	guests             *int
	stayNights         *int
	checkIn            *string
	sort               string
	centerLat          *float64
	centerLng          *float64
	north              *float64
	south              *float64
	east               *float64
	west               *float64
	hasBounds          bool
	maxStationWalkMin  *int
	amenitySlugs       []string
	excludePropertyIDs []uuid.UUID
}

func toSearchCriteria(query PropertySearchQuery) searchCriteria {
	var stayNights *int
	if query.CheckIn != nil && query.CheckOut != nil {
		checkIn, err1 := time.Parse("2006-01-02", *query.CheckIn)
		checkOut, err2 := time.Parse("2006-01-02", *query.CheckOut)
		if err1 == nil && err2 == nil {
			nights := int(checkOut.Sub(checkIn).Hours() / 24)
			stayNights = &nights
		}
	}

	hasBounds := query.North != nil && query.South != nil && query.East != nil && query.West != nil

	var textQuery *string
	if query.Query != nil {
		trimmed := strings.TrimSpace(*query.Query)
		if trimmed != "" {
			textQuery = &trimmed
		}
	}

	sort := query.Sort
	if sort == "" {
		sort = "recommended"
	}

	limit := query.Limit
	if limit <= 0 {
		limit = 20
	}
	if limit > 100 {
		limit = 100
	}

	excludeIDs := make([]uuid.UUID, 0, len(query.ExcludePropertyIDs))
	for _, raw := range query.ExcludePropertyIDs {
		if id, err := uuid.Parse(raw); err == nil {
			excludeIDs = append(excludeIDs, id)
		}
	}

	amenitySlugs := query.AmenitySlugs
	if len(amenitySlugs) == 0 {
		amenitySlugs = nil
	}

	return searchCriteria{
		textQuery:          textQuery,
		propertyType:       query.PropertyType,
		priceMin:           query.PriceMin,
		priceMax:           query.PriceMax,
		guests:             query.Guests,
		stayNights:         stayNights,
		checkIn:            query.CheckIn,
		sort:               sort,
		centerLat:          query.CenterLat,
		centerLng:          query.CenterLng,
		north:              query.North,
		south:              query.South,
		east:               query.East,
		west:               query.West,
		hasBounds:          hasBounds,
		maxStationWalkMin:  query.MaxStationWalkMin,
		amenitySlugs:       amenitySlugs,
		excludePropertyIDs: excludeIDs,
	}
}

func executePropertySearch(ctx context.Context, q pgx.Tx, criteria searchCriteria, limit, offset int) ([]SearchPropertyRow, error) {
	var amenitySlugs any
	if len(criteria.amenitySlugs) > 0 {
		amenitySlugs = criteria.amenitySlugs
	}

	var excludeIDs any
	if len(criteria.excludePropertyIDs) > 0 {
		excludeIDs = criteria.excludePropertyIDs
	}

	rows, err := q.Query(ctx, searchSQL,
		criteria.textQuery,
		criteria.propertyType,
		criteria.priceMin,
		criteria.priceMax,
		criteria.stayNights,
		criteria.guests,
		criteria.checkIn,
		criteria.hasBounds,
		criteria.west,
		criteria.south,
		criteria.centerLat,
		criteria.centerLng,
		criteria.east,
		criteria.north,
		criteria.maxStationWalkMin,
		amenitySlugs,
		excludeIDs,
		criteria.sort,
		limit,
		offset,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var results []SearchPropertyRow
	for rows.Next() {
		var row SearchPropertyRow
		if err := rows.Scan(
			&row.ID,
			&row.Title,
			&row.Slug,
			&row.PropertyType,
			&row.District,
			&row.NearestStationName,
			&row.MonthlyPriceMin,
			&row.Tags,
			&row.CoverStoragePath,
			&row.CoverAltText,
			&row.Latitude,
			&row.Longitude,
			&row.DistanceMeters,
			&row.TotalCount,
		); err != nil {
			return nil, err
		}
		results = append(results, row)
	}

	return results, rows.Err()
}
