package hosts

type RegisterHostRequest struct {
	DisplayName string `json:"displayName"`
}

type Host struct {
	ID          string  `json:"id"`
	ProfileID   string  `json:"profileId"`
	DisplayName string  `json:"displayName"`
	Status      string  `json:"status"`
	VerifiedAt  *string `json:"verifiedAt"`
	CreatedAt   string  `json:"createdAt"`
	UpdatedAt   string  `json:"updatedAt"`
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

type HostBooking struct {
	ID            string  `json:"id"`
	Status        string  `json:"status"`
	BookingType   string  `json:"bookingType"`
	CheckIn       string  `json:"checkIn"`
	CheckOut      string  `json:"checkOut"`
	GuestCount    int     `json:"guestCount"`
	CustomerNotes *string `json:"customerNotes"`
	PropertyTitle string  `json:"propertyTitle"`
	RoomName      string  `json:"roomName"`
	TotalKrw      int     `json:"totalKrw"`
	CreatedAt     string  `json:"createdAt"`
}
