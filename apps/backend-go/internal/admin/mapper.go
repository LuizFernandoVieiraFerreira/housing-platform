package admin

import (
	"encoding/json"

	"github.com/jackc/pgx/v5/pgtype"

	"github.com/housing-platform/backend-go/internal/shared"
)

func mapAdminProperty(row adminPropertyRow) AdminProperty {
	var monthlyMin *int
	if row.MonthlyPriceMin != nil {
		v := int(*row.MonthlyPriceMin)
		monthlyMin = &v
	}
	return AdminProperty{
		ID:              shared.UUIDToString(row.ID),
		Title:           row.Title,
		Slug:            row.Slug,
		PropertyType:    row.PropertyType,
		District:        row.District,
		Status:          row.Status,
		BookingMode:     row.BookingMode,
		MonthlyPriceMin: monthlyMin,
		RoomCount:       row.RoomCount,
		UpdatedAt:       shared.FormatTimestamptz(row.UpdatedAt),
		HostDisplayName: row.HostDisplayName,
	}
}

func mapAdminHost(row adminHostRow) AdminHost {
	return AdminHost{
		ID:          shared.UUIDToString(row.ID),
		DisplayName: row.DisplayName,
		Status:      row.Status,
		ProfileName: row.ProfileName,
		VerifiedAt:  shared.FormatNullableTimestamptz(row.VerifiedAt),
		CreatedAt:   shared.FormatTimestamptz(row.CreatedAt),
	}
}

func mapAdminPayment(row adminPaymentRow) AdminPayment {
	return AdminPayment{
		ID:            shared.UUIDToString(row.ID),
		OrderID:       shared.UUIDToString(row.OrderID),
		BookingID:     shared.UUIDToString(row.BookingID),
		AmountKrw:     int(row.AmountKrw),
		Status:        row.Status,
		PropertyTitle: row.PropertyTitle,
		CustomerName:  row.CustomerName,
		ConfirmedAt:   shared.FormatNullableTimestamptz(row.ConfirmedAt),
		CreatedAt:     shared.FormatTimestamptz(row.CreatedAt),
	}
}

func mapHousingRequest(row housingRequestRow) HousingRequest {
	var checkIn, checkOut *string
	if row.CheckIn.Valid {
		v := shared.FormatDate(row.CheckIn)
		checkIn = &v
	}
	if row.CheckOut.Valid {
		v := shared.FormatDate(row.CheckOut)
		checkOut = &v
	}
	var budgetMax *int
	if row.BudgetMax != nil {
		v := int(*row.BudgetMax)
		budgetMax = &v
	}
	return HousingRequest{
		ID:                shared.UUIDToString(row.ID),
		Email:             row.Email,
		DesiredArea:       row.DesiredArea,
		CheckIn:           checkIn,
		CheckOut:          checkOut,
		BudgetMax:         budgetMax,
		AccommodationType: row.AccommodationType,
		Notes:             row.Notes,
		Status:            row.Status,
		CreatedAt:         shared.FormatTimestamptz(row.CreatedAt),
	}
}

func mapAuditLog(row auditLogRow) AuditLog {
	metadata := map[string]any{}
	if len(row.Metadata) > 0 {
		_ = json.Unmarshal(row.Metadata, &metadata)
	}
	var entityID *string
	if row.EntityID.Valid {
		v := shared.UUIDToString(row.EntityID)
		entityID = &v
	}
	return AuditLog{
		ID:         shared.UUIDToString(row.ID),
		Action:     row.Action,
		EntityType: row.EntityType,
		EntityID:   entityID,
		ActorName:  row.ActorName,
		Metadata:   metadata,
		CreatedAt:  shared.FormatTimestamptz(row.CreatedAt),
	}
}

type adminPropertyRow struct {
	ID              pgtype.UUID
	Title           string
	Slug            string
	PropertyType    string
	District        string
	Status          string
	BookingMode     string
	MonthlyPriceMin *int32
	RoomCount       int
	UpdatedAt       pgtype.Timestamptz
	HostDisplayName string
}

type adminHostRow struct {
	ID          pgtype.UUID
	DisplayName string
	Status      string
	ProfileName string
	VerifiedAt  pgtype.Timestamptz
	CreatedAt   pgtype.Timestamptz
}

type adminPaymentRow struct {
	ID            pgtype.UUID
	OrderID       pgtype.UUID
	BookingID     pgtype.UUID
	AmountKrw     int32
	Status        string
	PropertyTitle *string
	CustomerName  *string
	ConfirmedAt   pgtype.Timestamptz
	CreatedAt     pgtype.Timestamptz
}

type housingRequestRow struct {
	ID                pgtype.UUID
	Email             string
	DesiredArea       string
	CheckIn           pgtype.Date
	CheckOut          pgtype.Date
	BudgetMax         *int32
	AccommodationType *string
	Notes             *string
	Status            string
	CreatedAt         pgtype.Timestamptz
}

type auditLogRow struct {
	ID         pgtype.UUID
	Action     string
	EntityType string
	EntityID   pgtype.UUID
	ActorName  string
	Metadata   []byte
	CreatedAt  pgtype.Timestamptz
}
