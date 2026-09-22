package hosts

import (
	"github.com/jackc/pgx/v5/pgtype"

	"github.com/housing-platform/backend-go/internal/db"
	"github.com/housing-platform/backend-go/internal/shared"
)

func MapHost(host db.Host) Host {
	return mapHost(host)
}

func mapHost(host db.Host) Host {
	return Host{
		ID:          shared.UUIDToString(host.ID),
		ProfileID:   shared.UUIDToString(host.ProfileID),
		DisplayName: host.DisplayName,
		Status:      string(host.Status),
		VerifiedAt:  shared.FormatNullableTimestamptz(host.VerifiedAt),
		CreatedAt:   shared.FormatTimestamptz(host.CreatedAt),
		UpdatedAt:   shared.FormatTimestamptz(host.UpdatedAt),
	}
}

func mapHostPropertyListItem(row hostPropertyListRow) HostPropertyListItem {
	var monthlyMin *int
	if row.MonthlyPriceMin != nil {
		v := int(*row.MonthlyPriceMin)
		monthlyMin = &v
	}
	return HostPropertyListItem{
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
	}
}

func MapHostBookingRow(
	id pgtype.UUID,
	status, bookingType string,
	checkIn, checkOut pgtype.Date,
	guestCount int32,
	customerNotes *string,
	propertyTitle, roomName string,
	totalKrw int32,
	createdAt pgtype.Timestamptz,
) HostBooking {
	return mapHostBooking(hostBookingRow{
		ID: id, Status: status, BookingType: bookingType,
		CheckIn: checkIn, CheckOut: checkOut, GuestCount: guestCount,
		CustomerNotes: customerNotes, PropertyTitle: propertyTitle,
		RoomName: roomName, TotalKrw: totalKrw, CreatedAt: createdAt,
	})
}

func mapHostBooking(row hostBookingRow) HostBooking {
	return HostBooking{
		ID:            shared.UUIDToString(row.ID),
		Status:        row.Status,
		BookingType:   row.BookingType,
		CheckIn:       shared.FormatDate(row.CheckIn),
		CheckOut:      shared.FormatDate(row.CheckOut),
		GuestCount:    int(row.GuestCount),
		CustomerNotes: row.CustomerNotes,
		PropertyTitle: row.PropertyTitle,
		RoomName:      row.RoomName,
		TotalKrw:      int(row.TotalKrw),
		CreatedAt:     shared.FormatTimestamptz(row.CreatedAt),
	}
}

type hostPropertyListRow struct {
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
}

type hostBookingRow struct {
	ID            pgtype.UUID
	Status        string
	BookingType   string
	CheckIn       pgtype.Date
	CheckOut      pgtype.Date
	GuestCount    int32
	CustomerNotes *string
	PropertyTitle string
	RoomName      string
	TotalKrw      int32
	CreatedAt     pgtype.Timestamptz
}
