package properties

type PropertySearchQuery struct {
	Query              *string  `json:"query"`
	PropertyType       *string  `json:"propertyType"`
	CheckIn            *string  `json:"checkIn"`
	CheckOut           *string  `json:"checkOut"`
	Guests             *int     `json:"guests"`
	PriceMin           *int     `json:"priceMin"`
	PriceMax           *int     `json:"priceMax"`
	Sort               string   `json:"sort"`
	CenterLat          *float64 `json:"centerLat"`
	CenterLng          *float64 `json:"centerLng"`
	North              *float64 `json:"north"`
	South              *float64 `json:"south"`
	East               *float64 `json:"east"`
	West               *float64 `json:"west"`
	AmenitySlugs       []string `json:"amenitySlugs"`
	MaxStationWalkMin  *int     `json:"maxStationWalkMin"`
	ExcludePropertyIDs []string `json:"excludePropertyIds"`
	Limit              int      `json:"limit"`
	Offset             int      `json:"offset"`
}

type SearchPropertyCard struct {
	ID                 string   `json:"id"`
	Title              string   `json:"title"`
	Slug               string   `json:"slug"`
	PropertyType       string   `json:"propertyType"`
	District           string   `json:"district"`
	NearestStationName *string  `json:"nearestStationName"`
	MonthlyPriceMin    int      `json:"monthlyPriceMin"`
	CoverImageURL      *string  `json:"coverImageUrl"`
	CoverImageAlt      *string  `json:"coverImageAlt"`
	Tags               []string `json:"tags"`
	Latitude           float64  `json:"latitude"`
	Longitude          float64  `json:"longitude"`
	DistanceMeters     *float64 `json:"distanceMeters"`
}

type PropertySearchResult struct {
	Items      []SearchPropertyCard `json:"items"`
	TotalCount int                  `json:"totalCount"`
}

type PropertyImage struct {
	ID          string  `json:"id"`
	StoragePath string  `json:"storagePath"`
	URL         string  `json:"url"`
	AltText     *string `json:"altText"`
	SortOrder   int     `json:"sortOrder"`
	IsCover     bool    `json:"isCover"`
}

type PropertyRoom struct {
	ID              string   `json:"id"`
	Name            string   `json:"name"`
	RoomType        *string  `json:"roomType"`
	SizeSqm         *float64 `json:"sizeSqm"`
	MaxOccupancy    int      `json:"maxOccupancy"`
	MonthlyPriceKrw int      `json:"monthlyPriceKrw"`
	Status          string   `json:"status"`
	AvailableFrom   *string  `json:"availableFrom"`
}

type PropertyAmenity struct {
	ID   string  `json:"id"`
	Slug string  `json:"slug"`
	Name string  `json:"name"`
	Icon *string `json:"icon"`
}

type PropertyDetail struct {
	ID                     string            `json:"id"`
	Title                  string            `json:"title"`
	Slug                   string            `json:"slug"`
	Description            string            `json:"description"`
	PropertyType           string            `json:"propertyType"`
	District               string            `json:"district"`
	NearestStationName     *string           `json:"nearestStationName"`
	NearestStationWalkMin  *int              `json:"nearestStationWalkMin"`
	AddressLine1           string            `json:"addressLine1"`
	AddressLine2           *string           `json:"addressLine2"`
	City                   string            `json:"city"`
	BookingMode            string            `json:"bookingMode"`
	MinStayNights          int               `json:"minStayNights"`
	MonthlyPriceMin        int               `json:"monthlyPriceMin"`
	Tags                   []string          `json:"tags"`
	HostDisplayName        string            `json:"hostDisplayName"`
	Latitude               *float64          `json:"latitude"`
	Longitude              *float64          `json:"longitude"`
	Images                 []PropertyImage   `json:"images"`
	Rooms                  []PropertyRoom    `json:"rooms"`
	Amenities              []PropertyAmenity `json:"amenities"`
}

type HostPropertyRequest struct {
	Title                 string   `json:"title"`
	Description           string   `json:"description"`
	PropertyType          string   `json:"propertyType"`
	AddressLine1          string   `json:"addressLine1"`
	AddressLine2          *string  `json:"addressLine2"`
	City                  string   `json:"city"`
	PostalCode            *string  `json:"postalCode"`
	District              string   `json:"district"`
	NearestStationName    *string  `json:"nearestStationName"`
	NearestStationWalkMin *int     `json:"nearestStationWalkMin"`
	BookingMode           string   `json:"bookingMode"`
	MinStayNights         int      `json:"minStayNights"`
	Tags                  []string `json:"tags"`
	AmenityIDs            []string `json:"amenityIds"`
	Latitude              *float64 `json:"latitude"`
	Longitude             *float64 `json:"longitude"`
}

type SetPropertyLocationRequest struct {
	Latitude  float64 `json:"latitude"`
	Longitude float64 `json:"longitude"`
}

type CreateRoomRequest struct {
	Name            string   `json:"name"`
	RoomType        *string  `json:"roomType"`
	SizeSqm         *float64 `json:"sizeSqm"`
	MaxOccupancy    int      `json:"maxOccupancy"`
	MonthlyPriceKrw int      `json:"monthlyPriceKrw"`
	AvailableFrom   *string  `json:"availableFrom"`
}

type HostRoom struct {
	ID              string   `json:"id"`
	Name            string   `json:"name"`
	RoomType        *string  `json:"roomType"`
	SizeSqm         *float64 `json:"sizeSqm"`
	MaxOccupancy    int      `json:"maxOccupancy"`
	MonthlyPriceKrw int      `json:"monthlyPriceKrw"`
	Status          string   `json:"status"`
	AvailableFrom   *string  `json:"availableFrom"`
}

type HostPropertyDetail struct {
	ID                     string     `json:"id"`
	Title                  string     `json:"title"`
	Slug                   string     `json:"slug"`
	Description            string     `json:"description"`
	PropertyType           string     `json:"propertyType"`
	AddressLine1           string     `json:"addressLine1"`
	AddressLine2           *string    `json:"addressLine2"`
	City                   string     `json:"city"`
	PostalCode             *string    `json:"postalCode"`
	District               string     `json:"district"`
	NearestStationName     *string    `json:"nearestStationName"`
	NearestStationWalkMin  *int       `json:"nearestStationWalkMin"`
	Status                 string     `json:"status"`
	BookingMode            string     `json:"bookingMode"`
	MinStayNights          int        `json:"minStayNights"`
	Tags                   []string   `json:"tags"`
	Latitude               *float64   `json:"latitude"`
	Longitude              *float64   `json:"longitude"`
	AmenityIDs             []string   `json:"amenityIds"`
	Rooms                  []HostRoom `json:"rooms"`
}

type HostPropertyListItem struct {
	ID              string  `json:"id"`
	Title           string  `json:"title"`
	Slug            string  `json:"slug"`
	PropertyType    string  `json:"propertyType"`
	District        string  `json:"district"`
	Status          string  `json:"status"`
	BookingMode     string  `json:"bookingMode"`
	MonthlyPriceMin *int    `json:"monthlyPriceMin"`
	RoomCount       int     `json:"roomCount"`
	UpdatedAt       string  `json:"updatedAt"`
}

type CreatedID struct {
	ID string `json:"id"`
}

type PropertyStatusChange struct {
	ID     string `json:"id"`
	Status string `json:"status"`
}

type Amenity struct {
	ID   string `json:"id"`
	Slug string `json:"slug"`
	Name string `json:"name"`
}
