package properties

import (
	"context"
	"errors"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/housing-platform/backend-go/internal/db"
	"github.com/housing-platform/backend-go/internal/shared"
)

type Coordinates struct {
	Latitude  float64
	Longitude float64
}

type Repository struct {
	pool *pgxpool.Pool
}

func NewRepository(pool *pgxpool.Pool) *Repository {
	return &Repository{pool: pool}
}

func (r *Repository) Search(ctx context.Context, tx pgx.Tx, criteria searchCriteria, limit, offset int) ([]SearchPropertyRow, error) {
	return executePropertySearch(ctx, tx, criteria, limit, offset)
}

func (r *Repository) GetPublishedProperty(ctx context.Context, q pgx.Tx, propertyID pgtype.UUID) (*db.Property, error) {
	row := q.QueryRow(ctx, `
		SELECT id, host_id, title, slug, description, property_type, address_line1, address_line2,
		       city, postal_code, country, location, district, nearest_station_name,
		       nearest_station_walk_min, status, booking_mode, min_stay_nights, monthly_price_min,
		       is_featured, tags, published_at, deleted_at, created_at, updated_at,
		       embedding_sync_status, embedding_sync_requested_at, embedding_synced_at,
		       embedding_sync_error, embedding_sync_attempts
		FROM public.properties
		WHERE id = $1 AND status = 'published' AND deleted_at IS NULL
	`, propertyID)
	return scanProperty(row)
}

func (r *Repository) GetHostProperty(ctx context.Context, q pgx.Tx, propertyID pgtype.UUID) (*db.Property, error) {
	row := q.QueryRow(ctx, `
		SELECT id, host_id, title, slug, description, property_type, address_line1, address_line2,
		       city, postal_code, country, location, district, nearest_station_name,
		       nearest_station_walk_min, status, booking_mode, min_stay_nights, monthly_price_min,
		       is_featured, tags, published_at, deleted_at, created_at, updated_at,
		       embedding_sync_status, embedding_sync_requested_at, embedding_synced_at,
		       embedding_sync_error, embedding_sync_attempts
		FROM public.properties
		WHERE id = $1 AND deleted_at IS NULL
	`, propertyID)
	prop, err := scanProperty(row)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	return prop, nil
}

func (r *Repository) GetPropertyImages(ctx context.Context, q pgx.Tx, propertyID pgtype.UUID) ([]db.PropertyImage, error) {
	rows, err := q.Query(ctx, `
		SELECT id, property_id, storage_path, sort_order, alt_text, is_cover, created_at
		FROM public.property_images
		WHERE property_id = $1
		ORDER BY is_cover DESC, sort_order ASC, created_at ASC
	`, propertyID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var images []db.PropertyImage
	for rows.Next() {
		var image db.PropertyImage
		if err := rows.Scan(
			&image.ID, &image.PropertyID, &image.StoragePath, &image.SortOrder,
			&image.AltText, &image.IsCover, &image.CreatedAt,
		); err != nil {
			return nil, err
		}
		images = append(images, image)
	}
	return images, rows.Err()
}

func (r *Repository) GetPropertyRooms(ctx context.Context, q pgx.Tx, propertyID pgtype.UUID) ([]db.Room, error) {
	rows, err := q.Query(ctx, `
		SELECT id, property_id, name, room_type, size_sqm, max_occupancy, monthly_price_krw,
		       status, available_from, deleted_at, created_at, updated_at
		FROM public.rooms
		WHERE property_id = $1
		ORDER BY monthly_price_krw ASC
	`, propertyID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var rooms []db.Room
	for rows.Next() {
		var room db.Room
		if err := rows.Scan(
			&room.ID, &room.PropertyID, &room.Name, &room.RoomType, &room.SizeSqm,
			&room.MaxOccupancy, &room.MonthlyPriceKrw, &room.Status, &room.AvailableFrom,
			&room.DeletedAt, &room.CreatedAt, &room.UpdatedAt,
		); err != nil {
			return nil, err
		}
		rooms = append(rooms, room)
	}
	return rooms, rows.Err()
}

func (r *Repository) GetPropertyAmenities(ctx context.Context, q pgx.Tx, propertyID pgtype.UUID) ([]db.Amenity, error) {
	rows, err := q.Query(ctx, `
		SELECT a.id, a.slug, a.name, a.icon, a.sort_order, a.created_at
		FROM public.amenities a
		INNER JOIN public.property_amenities pa ON pa.amenity_id = a.id
		WHERE pa.property_id = $1
		ORDER BY a.sort_order
	`, propertyID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var amenities []db.Amenity
	for rows.Next() {
		var amenity db.Amenity
		if err := rows.Scan(
			&amenity.ID, &amenity.Slug, &amenity.Name, &amenity.Icon,
			&amenity.SortOrder, &amenity.CreatedAt,
		); err != nil {
			return nil, err
		}
		amenities = append(amenities, amenity)
	}
	return amenities, rows.Err()
}

func (r *Repository) GetPropertyAmenityIDs(ctx context.Context, q pgx.Tx, propertyID pgtype.UUID) ([]string, error) {
	rows, err := q.Query(ctx, `
		SELECT amenity_id FROM public.property_amenities WHERE property_id = $1
	`, propertyID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var ids []string
	for rows.Next() {
		var id pgtype.UUID
		if err := rows.Scan(&id); err != nil {
			return nil, err
		}
		ids = append(ids, shared.UUIDToString(id))
	}
	return ids, rows.Err()
}

func (r *Repository) GetPublishedCoordinates(ctx context.Context, q pgx.Tx, propertyID pgtype.UUID) (*Coordinates, error) {
	return r.getCoordinates(ctx, q, propertyID, true)
}

func (r *Repository) GetCoordinates(ctx context.Context, q pgx.Tx, propertyID pgtype.UUID) (*Coordinates, error) {
	return r.getCoordinates(ctx, q, propertyID, false)
}

func (r *Repository) getCoordinates(ctx context.Context, q pgx.Tx, propertyID pgtype.UUID, publishedOnly bool) (*Coordinates, error) {
	sql := `
		SELECT
		  extensions.st_y(p.location::extensions.geometry) AS latitude,
		  extensions.st_x(p.location::extensions.geometry) AS longitude
		FROM public.properties p
		WHERE p.id = $1
		  AND p.deleted_at IS NULL
		  AND p.location IS NOT NULL
	`
	if publishedOnly {
		sql += " AND p.status = 'published'"
	}

	var lat, lng float64
	err := q.QueryRow(ctx, sql, propertyID).Scan(&lat, &lng)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	return &Coordinates{Latitude: lat, Longitude: lng}, nil
}

func (r *Repository) CreateProperty(ctx context.Context, q pgx.Tx, hostID pgtype.UUID, slug string, fields propertyFields) (pgtype.UUID, error) {
	var id pgtype.UUID
	err := q.QueryRow(ctx, `
		INSERT INTO public.properties (
		  host_id, slug, status, country, title, description, property_type,
		  address_line1, address_line2, city, postal_code, district,
		  nearest_station_name, nearest_station_walk_min, booking_mode, min_stay_nights, tags
		) VALUES (
		  $1, $2, 'draft', 'KR', $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15
		) RETURNING id
	`,
		hostID, slug, fields.Title, fields.Description, fields.PropertyType,
		fields.AddressLine1, fields.AddressLine2, fields.City, fields.PostalCode,
		fields.District, fields.NearestStationName, fields.NearestStationWalkMin,
		fields.BookingMode, fields.MinStayNights, fields.Tags,
	).Scan(&id)
	return id, err
}

func (r *Repository) UpdateProperty(ctx context.Context, q pgx.Tx, propertyID pgtype.UUID, fields propertyFields) error {
	tag, err := q.Exec(ctx, `
		UPDATE public.properties SET
		  title = $2, description = $3, property_type = $4,
		  address_line1 = $5, address_line2 = $6, city = $7, postal_code = $8,
		  district = $9, nearest_station_name = $10, nearest_station_walk_min = $11,
		  booking_mode = $12, min_stay_nights = $13, tags = $14
		WHERE id = $1 AND deleted_at IS NULL
	`,
		propertyID, fields.Title, fields.Description, fields.PropertyType,
		fields.AddressLine1, fields.AddressLine2, fields.City, fields.PostalCode,
		fields.District, fields.NearestStationName, fields.NearestStationWalkMin,
		fields.BookingMode, fields.MinStayNights, fields.Tags,
	)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return pgx.ErrNoRows
	}
	return nil
}

func (r *Repository) SetLocation(ctx context.Context, q pgx.Tx, propertyID pgtype.UUID, latitude, longitude float64) (bool, error) {
	var updatedID pgtype.UUID
	err := q.QueryRow(ctx, `
		UPDATE public.properties
		SET location = extensions.st_setsrid(
		  extensions.st_makepoint($3, $2),
		  4326
		)::extensions.geography
		WHERE id = $1
		  AND deleted_at IS NULL
		  AND status IN ('draft', 'pending_review')
		RETURNING id
	`, propertyID, latitude, longitude).Scan(&updatedID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return false, nil
		}
		return false, err
	}
	return updatedID.Valid, nil
}

func (r *Repository) CountAvailableRooms(ctx context.Context, q pgx.Tx, propertyID pgtype.UUID) (int, error) {
	var count int
	err := q.QueryRow(ctx, `
		SELECT count(*)::integer FROM public.rooms
		WHERE property_id = $1 AND deleted_at IS NULL AND status = 'available'
	`, propertyID).Scan(&count)
	return count, err
}

func (r *Repository) HasLocation(ctx context.Context, q pgx.Tx, propertyID pgtype.UUID) (bool, error) {
	var exists bool
	err := q.QueryRow(ctx, `
		SELECT EXISTS(
		  SELECT 1 FROM public.properties
		  WHERE id = $1 AND location IS NOT NULL
		)
	`, propertyID).Scan(&exists)
	return exists, err
}

func (r *Repository) SubmitForReview(ctx context.Context, q pgx.Tx, propertyID pgtype.UUID) (string, error) {
	var status string
	err := q.QueryRow(ctx, `
		UPDATE public.properties
		SET status = 'pending_review'
		WHERE id = $1 AND deleted_at IS NULL AND status = 'draft'
		RETURNING status::text
	`, propertyID).Scan(&status)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return "", nil
		}
		return "", err
	}
	return status, nil
}

func (r *Repository) SyncAmenities(ctx context.Context, q pgx.Tx, propertyID pgtype.UUID, amenityIDs []pgtype.UUID) error {
	if _, err := q.Exec(ctx, `DELETE FROM public.property_amenities WHERE property_id = $1`, propertyID); err != nil {
		return err
	}
	for _, amenityID := range amenityIDs {
		if _, err := q.Exec(ctx, `
			INSERT INTO public.property_amenities (property_id, amenity_id) VALUES ($1, $2)
		`, propertyID, amenityID); err != nil {
			return err
		}
	}
	return nil
}

func (r *Repository) GetHostDisplayName(ctx context.Context, q pgx.Tx, hostID pgtype.UUID) (string, error) {
	var displayName *string
	err := q.QueryRow(ctx, `
		SELECT display_name FROM public.hosts
		WHERE id = $1 AND deleted_at IS NULL
	`, hostID).Scan(&displayName)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return "Host", nil
		}
		return "", err
	}
	if displayName == nil || *displayName == "" {
		return "Host", nil
	}
	return *displayName, nil
}

func (r *Repository) ListAmenities(ctx context.Context) ([]db.Amenity, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT id, slug, name, icon, sort_order, created_at
		FROM public.amenities
		ORDER BY sort_order
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var amenities []db.Amenity
	for rows.Next() {
		var amenity db.Amenity
		if err := rows.Scan(
			&amenity.ID, &amenity.Slug, &amenity.Name, &amenity.Icon,
			&amenity.SortOrder, &amenity.CreatedAt,
		); err != nil {
			return nil, err
		}
		amenities = append(amenities, amenity)
	}
	return amenities, rows.Err()
}

func (r *Repository) CreateRoom(ctx context.Context, q pgx.Tx, propertyID pgtype.UUID, req CreateRoomRequest) (*db.Room, error) {
	var room db.Room
	var availableFrom pgtype.Date
	if req.AvailableFrom != nil {
		d, err := shared.ParseDate(*req.AvailableFrom)
		if err != nil {
			return nil, err
		}
		availableFrom = d
	}

	err := q.QueryRow(ctx, `
		INSERT INTO public.rooms (
		  property_id, name, room_type, size_sqm, max_occupancy,
		  monthly_price_krw, status, available_from
		) VALUES ($1, $2, $3, $4, $5, $6, 'available', $7)
		RETURNING id, property_id, name, room_type, size_sqm, max_occupancy,
		          monthly_price_krw, status, available_from, deleted_at, created_at, updated_at
	`,
		propertyID, req.Name, req.RoomType, req.SizeSqm, req.MaxOccupancy,
		req.MonthlyPriceKrw, availableFrom,
	).Scan(
		&room.ID, &room.PropertyID, &room.Name, &room.RoomType, &room.SizeSqm,
		&room.MaxOccupancy, &room.MonthlyPriceKrw, &room.Status, &room.AvailableFrom,
		&room.DeletedAt, &room.CreatedAt, &room.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	return &room, nil
}

func (r *Repository) FindRoomPropertyID(ctx context.Context, q pgx.Tx, roomID pgtype.UUID) (pgtype.UUID, error) {
	var propertyID pgtype.UUID
	err := q.QueryRow(ctx, `
		SELECT property_id FROM public.rooms WHERE id = $1
	`, roomID).Scan(&propertyID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return pgtype.UUID{}, nil
		}
		return pgtype.UUID{}, err
	}
	return propertyID, nil
}

func (r *Repository) DeleteRoom(ctx context.Context, q pgx.Tx, roomID pgtype.UUID) (bool, error) {
	tag, err := q.Exec(ctx, `DELETE FROM public.rooms WHERE id = $1`, roomID)
	if err != nil {
		return false, err
	}
	return tag.RowsAffected() > 0, nil
}

type propertyFields struct {
	Title                 string
	Description           string
	PropertyType          string
	AddressLine1          string
	AddressLine2          *string
	City                  string
	PostalCode            *string
	District              string
	NearestStationName    *string
	NearestStationWalkMin *int32
	BookingMode           string
	MinStayNights         int32
	Tags                  []string
}

func scanProperty(row pgx.Row) (*db.Property, error) {
	var prop db.Property
	err := row.Scan(
		&prop.ID, &prop.HostID, &prop.Title, &prop.Slug, &prop.Description,
		&prop.PropertyType, &prop.AddressLine1, &prop.AddressLine2, &prop.City,
		&prop.PostalCode, &prop.Country, &prop.Location, &prop.District,
		&prop.NearestStationName, &prop.NearestStationWalkMin, &prop.Status,
		&prop.BookingMode, &prop.MinStayNights, &prop.MonthlyPriceMin,
		&prop.IsFeatured, &prop.Tags, &prop.PublishedAt, &prop.DeletedAt,
		&prop.CreatedAt, &prop.UpdatedAt, &prop.EmbeddingSyncStatus,
		&prop.EmbeddingSyncRequestedAt, &prop.EmbeddingSyncedAt,
		&prop.EmbeddingSyncError, &prop.EmbeddingSyncAttempts,
	)
	if err != nil {
		return nil, err
	}
	return &prop, nil
}
