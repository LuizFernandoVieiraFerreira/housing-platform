package admin

type AdminDashboardStats struct {
	PendingProperties    int `json:"pendingProperties"`
	PendingHosts         int `json:"pendingHosts"`
	OpenBookings         int `json:"openBookings"`
	OpenHousingRequests  int `json:"openHousingRequests"`
}

type AdminHost struct {
	ID          string  `json:"id"`
	DisplayName string  `json:"displayName"`
	Status      string  `json:"status"`
	ProfileName string  `json:"profileName"`
	VerifiedAt  *string `json:"verifiedAt"`
	CreatedAt   string  `json:"createdAt"`
}

type AdminProperty struct {
	ID                string  `json:"id"`
	Title             string  `json:"title"`
	Slug              string  `json:"slug"`
	PropertyType      string  `json:"propertyType"`
	District          string  `json:"district"`
	Status            string  `json:"status"`
	BookingMode       string  `json:"bookingMode"`
	MonthlyPriceMin   *int    `json:"monthlyPriceMin"`
	RoomCount         int     `json:"roomCount"`
	UpdatedAt         string  `json:"updatedAt"`
	HostDisplayName   string  `json:"hostDisplayName"`
}

type AdminPayment struct {
	ID            string  `json:"id"`
	OrderID       string  `json:"orderId"`
	BookingID     string  `json:"bookingId"`
	AmountKrw     int     `json:"amountKrw"`
	Status        string  `json:"status"`
	PropertyTitle *string `json:"propertyTitle"`
	CustomerName  *string `json:"customerName"`
	ConfirmedAt   *string `json:"confirmedAt"`
	CreatedAt     string  `json:"createdAt"`
}

type HousingRequest struct {
	ID                string  `json:"id"`
	Email             string  `json:"email"`
	DesiredArea       string  `json:"desiredArea"`
	CheckIn           *string `json:"checkIn"`
	CheckOut          *string `json:"checkOut"`
	BudgetMax         *int    `json:"budgetMax"`
	AccommodationType *string `json:"accommodationType"`
	Notes             *string `json:"notes"`
	Status            string  `json:"status"`
	CreatedAt         string  `json:"createdAt"`
}

type UpdateHousingRequestStatusRequest struct {
	Status string `json:"status"`
}

type AuditLog struct {
	ID         string         `json:"id"`
	Action     string         `json:"action"`
	EntityType string         `json:"entityType"`
	EntityID   *string        `json:"entityId"`
	ActorName  string         `json:"actorName"`
	Metadata   map[string]any `json:"metadata"`
	CreatedAt  string         `json:"createdAt"`
}

type PropertyStatusChange struct {
	ID     string `json:"id"`
	Status string `json:"status"`
}
