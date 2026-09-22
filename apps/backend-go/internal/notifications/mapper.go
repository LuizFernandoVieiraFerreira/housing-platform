package notifications

import (
	"encoding/json"

	"github.com/housing-platform/backend-go/internal/db"
	"github.com/housing-platform/backend-go/internal/shared"
)

func mapNotification(notification db.Notification) Notification {
	metadata := map[string]any{}
	if len(notification.Metadata) > 0 {
		_ = json.Unmarshal(notification.Metadata, &metadata)
	}
	return Notification{
		ID:        shared.UUIDToString(notification.ID),
		UserID:    shared.UUIDToString(notification.UserID),
		Type:      string(notification.Type),
		Title:     notification.Title,
		Body:      notification.Body,
		Metadata:  metadata,
		ReadAt:    shared.FormatNullableTimestamptz(notification.ReadAt),
		CreatedAt: shared.FormatTimestamptz(notification.CreatedAt),
	}
}
