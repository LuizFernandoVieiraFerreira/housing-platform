package profile

type Profile struct {
	ID                string  `json:"id"`
	Role              string  `json:"role"`
	FullName          string  `json:"fullName"`
	Phone             *string `json:"phone"`
	AvatarURL         *string `json:"avatarUrl"`
	PreferredLanguage string  `json:"preferredLanguage"`
	MarketingConsent  bool    `json:"marketingConsent"`
	CreatedAt         string  `json:"createdAt"`
	UpdatedAt         string  `json:"updatedAt"`
}

type UpdateProfileRequest struct {
	FullName          string  `json:"fullName"`
	Phone             *string `json:"phone"`
	PreferredLanguage string  `json:"preferredLanguage"`
	MarketingConsent  bool    `json:"marketingConsent"`
	AvatarURL         *string `json:"avatarUrl"`
}
