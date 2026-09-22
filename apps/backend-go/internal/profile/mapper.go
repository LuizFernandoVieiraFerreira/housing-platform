package profile

import (
	"github.com/housing-platform/backend-go/internal/db"
	"github.com/housing-platform/backend-go/internal/shared"
)

func mapProfile(profile db.Profile) Profile {
	return Profile{
		ID:                shared.UUIDToString(profile.ID),
		Role:              string(profile.Role),
		FullName:          profile.FullName,
		Phone:             profile.Phone,
		AvatarURL:         profile.AvatarUrl,
		PreferredLanguage: profile.PreferredLanguage,
		MarketingConsent:  profile.MarketingConsent,
		CreatedAt:         shared.FormatTimestamptz(profile.CreatedAt),
		UpdatedAt:         shared.FormatTimestamptz(profile.UpdatedAt),
	}
}
