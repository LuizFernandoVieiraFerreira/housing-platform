package properties

import (
	"regexp"
	"strings"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"

	"github.com/housing-platform/backend-go/internal/config"
	"github.com/housing-platform/backend-go/internal/db"
	"github.com/housing-platform/backend-go/internal/shared"
)

func numericToFloat64(value pgtype.Numeric) *float64 {
	if !value.Valid {
		return nil
	}
	f, err := value.Float64Value()
	if err != nil || !f.Valid {
		return nil
	}
	v := f.Float64
	return &v
}

var slugSanitizer = regexp.MustCompile(`[^a-z0-9]+`)

func createPropertySlug(title string) string {
	base := slugSanitizer.ReplaceAllString(strings.ToLower(title), "-")
	base = strings.Trim(base, "-")
	if base == "" {
		base = "listing"
	}
	return base + "-" + uuid.New().String()[:8]
}

func normalizeTags(tags []string) []string {
	out := make([]string, 0, len(tags))
	for _, tag := range tags {
		trimmed := strings.TrimSpace(tag)
		if trimmed != "" {
			out = append(out, trimmed)
		}
	}
	if len(out) > 20 {
		return out[:20]
	}
	return out
}

func mapSearchPropertyCard(cfg *config.Config, row SearchPropertyRow) SearchPropertyCard {
	var coverURL *string
	if row.CoverStoragePath != nil {
		url := shared.ResolvePropertyImageURL(cfg, *row.CoverStoragePath)
		coverURL = &url
	}
	tags := row.Tags
	if tags == nil {
		tags = []string{}
	}
	return SearchPropertyCard{
		ID:                 row.ID.String(),
		Title:              row.Title,
		Slug:               row.Slug,
		PropertyType:       row.PropertyType,
		District:           row.District,
		NearestStationName: row.NearestStationName,
		MonthlyPriceMin:    row.MonthlyPriceMin,
		CoverImageURL:      coverURL,
		CoverImageAlt:      row.CoverAltText,
		Tags:               tags,
		Latitude:           row.Latitude,
		Longitude:          row.Longitude,
		DistanceMeters:     row.DistanceMeters,
	}
}

func mapPropertyImages(cfg *config.Config, images []db.PropertyImage) []PropertyImage {
	out := make([]PropertyImage, 0, len(images))
	for _, image := range images {
		out = append(out, PropertyImage{
			ID:          shared.UUIDToString(image.ID),
			StoragePath: image.StoragePath,
			URL:         shared.ResolvePropertyImageURL(cfg, image.StoragePath),
			AltText:     image.AltText,
			SortOrder:   int(image.SortOrder),
			IsCover:     image.IsCover,
		})
	}
	return out
}

func mapPropertyRooms(rooms []db.Room) []PropertyRoom {
	out := make([]PropertyRoom, 0)
	for _, room := range rooms {
		if room.DeletedAt.Valid || room.Status != db.RoomStatusAvailable {
			continue
		}
		sizeSqm := numericToFloat64(room.SizeSqm)
		out = append(out, PropertyRoom{
			ID:              shared.UUIDToString(room.ID),
			Name:            room.Name,
			RoomType:        room.RoomType,
			SizeSqm:         sizeSqm,
			MaxOccupancy:    int(room.MaxOccupancy),
			MonthlyPriceKrw: int(room.MonthlyPriceKrw),
			Status:          string(room.Status),
			AvailableFrom:   shared.FormatNullableDate(room.AvailableFrom),
		})
	}
	return out
}

func mapHostRooms(rooms []db.Room) []HostRoom {
	out := make([]HostRoom, 0, len(rooms))
	for _, room := range rooms {
		if room.DeletedAt.Valid {
			continue
		}
		sizeSqm := numericToFloat64(room.SizeSqm)
		out = append(out, HostRoom{
			ID:              shared.UUIDToString(room.ID),
			Name:            room.Name,
			RoomType:        room.RoomType,
			SizeSqm:         sizeSqm,
			MaxOccupancy:    int(room.MaxOccupancy),
			MonthlyPriceKrw: int(room.MonthlyPriceKrw),
			Status:          string(room.Status),
			AvailableFrom:   shared.FormatNullableDate(room.AvailableFrom),
		})
	}
	return out
}

func mapPropertyAmenities(amenities []db.Amenity) []PropertyAmenity {
	out := make([]PropertyAmenity, 0, len(amenities))
	for _, amenity := range amenities {
		out = append(out, PropertyAmenity{
			ID:   shared.UUIDToString(amenity.ID),
			Slug: amenity.Slug,
			Name: amenity.Name,
			Icon: amenity.Icon,
		})
	}
	return out
}

func MapHostPropertyDetail(property db.Property, rooms []db.Room, amenityIDs []string, lat, lng *float64) HostPropertyDetail {
	tags := property.Tags
	if tags == nil {
		tags = []string{}
	}
	if amenityIDs == nil {
		amenityIDs = []string{}
	}
	var monthlyPriceMin *int
	if property.MonthlyPriceMin != nil {
		v := int(*property.MonthlyPriceMin)
		monthlyPriceMin = &v
	}
	_ = monthlyPriceMin

	var nearestWalk *int
	if property.NearestStationWalkMin != nil {
		v := int(*property.NearestStationWalkMin)
		nearestWalk = &v
	}

	return HostPropertyDetail{
		ID:                    shared.UUIDToString(property.ID),
		Title:                 property.Title,
		Slug:                  property.Slug,
		Description:           property.Description,
		PropertyType:          string(property.PropertyType),
		AddressLine1:          property.AddressLine1,
		AddressLine2:          property.AddressLine2,
		City:                  property.City,
		PostalCode:            property.PostalCode,
		District:              property.District,
		NearestStationName:    property.NearestStationName,
		NearestStationWalkMin: nearestWalk,
		Status:                string(property.Status),
		BookingMode:           string(property.BookingMode),
		MinStayNights:         int(property.MinStayNights),
		Tags:                  tags,
		Latitude:              lat,
		Longitude:             lng,
		AmenityIDs:            amenityIDs,
		Rooms:                 mapHostRooms(rooms),
	}
}

func mapHostPropertyListItem(row hostPropertyListRow) HostPropertyListItem {
	return HostPropertyListItem{
		ID:              row.ID,
		Title:           row.Title,
		Slug:            row.Slug,
		PropertyType:    row.PropertyType,
		District:        row.District,
		Status:          row.Status,
		BookingMode:     row.BookingMode,
		MonthlyPriceMin: row.MonthlyPriceMin,
		RoomCount:       row.RoomCount,
		UpdatedAt:       row.UpdatedAt,
	}
}

type hostPropertyListRow struct {
	ID              string
	Title           string
	Slug            string
	PropertyType    string
	District        string
	Status          string
	BookingMode     string
	MonthlyPriceMin *int
	RoomCount       int
	UpdatedAt       string
}

func requestToPropertyFields(req HostPropertyRequest) propertyFields {
	var nearestWalk *int32
	if req.NearestStationWalkMin != nil {
		v := int32(*req.NearestStationWalkMin)
		nearestWalk = &v
	}
	return propertyFields{
		Title:                 req.Title,
		Description:           req.Description,
		PropertyType:          req.PropertyType,
		AddressLine1:          req.AddressLine1,
		AddressLine2:          req.AddressLine2,
		City:                  req.City,
		PostalCode:            req.PostalCode,
		District:              req.District,
		NearestStationName:    req.NearestStationName,
		NearestStationWalkMin: nearestWalk,
		BookingMode:           req.BookingMode,
		MinStayNights:         int32(req.MinStayNights),
		Tags:                  normalizeTags(req.Tags),
	}
}

func mapPropertyDetail(cfg *config.Config, property db.Property, hostDisplayName string, lat, lng *float64, images []db.PropertyImage, rooms []db.Room, amenities []db.Amenity) PropertyDetail {
	tags := property.Tags
	if tags == nil {
		tags = []string{}
	}
	monthlyMin := 0
	if property.MonthlyPriceMin != nil {
		monthlyMin = int(*property.MonthlyPriceMin)
	}
	var nearestWalk *int
	if property.NearestStationWalkMin != nil {
		v := int(*property.NearestStationWalkMin)
		nearestWalk = &v
	}
	return PropertyDetail{
		ID:                    shared.UUIDToString(property.ID),
		Title:                 property.Title,
		Slug:                  property.Slug,
		Description:           property.Description,
		PropertyType:          string(property.PropertyType),
		District:              property.District,
		NearestStationName:    property.NearestStationName,
		NearestStationWalkMin: nearestWalk,
		AddressLine1:          property.AddressLine1,
		AddressLine2:          property.AddressLine2,
		City:                  property.City,
		BookingMode:           string(property.BookingMode),
		MinStayNights:         int(property.MinStayNights),
		MonthlyPriceMin:       monthlyMin,
		Tags:                  tags,
		HostDisplayName:       hostDisplayName,
		Latitude:              lat,
		Longitude:             lng,
		Images:                mapPropertyImages(cfg, images),
		Rooms:                 mapPropertyRooms(rooms),
		Amenities:             mapPropertyAmenities(amenities),
	}
}

func mapHostRoom(room db.Room) HostRoom {
	sizeSqm := numericToFloat64(room.SizeSqm)
	return HostRoom{
		ID:              shared.UUIDToString(room.ID),
		Name:            room.Name,
		RoomType:        room.RoomType,
		SizeSqm:         sizeSqm,
		MaxOccupancy:    int(room.MaxOccupancy),
		MonthlyPriceKrw: int(room.MonthlyPriceKrw),
		Status:          string(room.Status),
		AvailableFrom:   shared.FormatNullableDate(room.AvailableFrom),
	}
}

func mapAmenity(amenity db.Amenity) Amenity {
	return Amenity{
		ID:   shared.UUIDToString(amenity.ID),
		Slug: amenity.Slug,
		Name: amenity.Name,
	}
}
