package notifications

type Notification struct {
	ID        string         `json:"id"`
	UserID    string         `json:"userId"`
	Type      string         `json:"type"`
	Title     string         `json:"title"`
	Body      string         `json:"body"`
	Metadata  map[string]any `json:"metadata"`
	ReadAt    *string        `json:"readAt"`
	CreatedAt string         `json:"createdAt"`
}

type UnreadNotificationCount struct {
	Count int `json:"count"`
}

type MarkAllNotificationsReadResult struct {
	UpdatedCount int `json:"updatedCount"`
}
