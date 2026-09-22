package bookings

type BookingQuoteQuery struct {
	RoomID     string `json:"roomId"`
	CheckIn    string `json:"checkIn"`
	CheckOut   string `json:"checkOut"`
	GuestCount int    `json:"guestCount"`
}

type BookingQuote struct {
	RoomID         string `json:"roomId"`
	PropertyID     string `json:"propertyId"`
	BookingMode    string `json:"bookingMode"`
	Nights         int    `json:"nights"`
	RentKrw        int    `json:"rentKrw"`
	ServiceFeeKrw  int    `json:"serviceFeeKrw"`
	TotalKrw       int    `json:"totalKrw"`
	PricingVersion string `json:"pricingVersion"`
}

type CreateBookingRequest struct {
	RoomID        string  `json:"roomId"`
	CheckIn       string  `json:"checkIn"`
	CheckOut      string  `json:"checkOut"`
	GuestCount    int     `json:"guestCount"`
	CustomerNotes *string `json:"customerNotes"`
}

type Booking struct {
	ID                string  `json:"id"`
	CustomerID        string  `json:"customerId"`
	RoomID            string  `json:"roomId"`
	PropertyID        string  `json:"propertyId"`
	CheckIn           string  `json:"checkIn"`
	CheckOut          string  `json:"checkOut"`
	GuestCount        int     `json:"guestCount"`
	Status            string  `json:"status"`
	BookingType       string  `json:"bookingType"`
	HoldExpiresAt     *string `json:"holdExpiresAt"`
	CustomerNotes     *string `json:"customerNotes"`
	ApprovedAt        *string `json:"approvedAt"`
	ApprovedBy        *string `json:"approvedBy"`
	CancelledAt       *string `json:"cancelledAt"`
	PaymentRetryCount int     `json:"paymentRetryCount"`
	CreatedAt         string  `json:"createdAt"`
	UpdatedAt         string  `json:"updatedAt"`
}

type BookingListItem struct {
	ID            string  `json:"id"`
	Status        string  `json:"status"`
	BookingType   string  `json:"bookingType"`
	CheckIn       string  `json:"checkIn"`
	CheckOut      string  `json:"checkOut"`
	GuestCount    int     `json:"guestCount"`
	PropertyTitle string  `json:"propertyTitle"`
	District      string  `json:"district"`
	RoomName      string  `json:"roomName"`
	TotalKrw      int     `json:"totalKrw"`
	HoldExpiresAt *string `json:"holdExpiresAt"`
	CreatedAt     string  `json:"createdAt"`
}

type BookingDetail struct {
	BookingListItem
	CustomerNotes     *string `json:"customerNotes"`
	RentKrw           int     `json:"rentKrw"`
	ServiceFeeKrw     int     `json:"serviceFeeKrw"`
	ServiceFeePercent float64 `json:"serviceFeePercent"`
	PricingVersion    string  `json:"pricingVersion"`
	PropertyID        string  `json:"propertyId"`
	RoomID            string  `json:"roomId"`
}
