package bookings

import (
	"github.com/housing-platform/backend-go/internal/db"
	"github.com/housing-platform/backend-go/internal/shared"
)

func mapBookingQuote(roomID, propertyID, bookingMode string, price shared.BookingPrice, nights int) BookingQuote {
	return BookingQuote{
		RoomID:         roomID,
		PropertyID:     propertyID,
		BookingMode:    bookingMode,
		Nights:         nights,
		RentKrw:        price.RentKrw,
		ServiceFeeKrw:  price.ServiceFeeKrw,
		TotalKrw:       price.TotalKrw,
		PricingVersion: price.PricingVersion,
	}
}

func mapBooking(booking db.Booking) Booking {
	var approvedBy *string
	if booking.ApprovedBy.Valid {
		v := shared.UUIDToString(booking.ApprovedBy)
		approvedBy = &v
	}
	return Booking{
		ID:                shared.UUIDToString(booking.ID),
		CustomerID:        shared.UUIDToString(booking.CustomerID),
		RoomID:            shared.UUIDToString(booking.RoomID),
		PropertyID:        shared.UUIDToString(booking.PropertyID),
		CheckIn:           shared.FormatDate(booking.CheckIn),
		CheckOut:          shared.FormatDate(booking.CheckOut),
		GuestCount:        int(booking.GuestCount),
		Status:            string(booking.Status),
		BookingType:       string(booking.BookingType),
		HoldExpiresAt:     shared.FormatNullableTimestamptz(booking.HoldExpiresAt),
		CustomerNotes:     booking.CustomerNotes,
		ApprovedAt:        shared.FormatNullableTimestamptz(booking.ApprovedAt),
		ApprovedBy:        approvedBy,
		CancelledAt:       shared.FormatNullableTimestamptz(booking.CancelledAt),
		PaymentRetryCount: int(booking.PaymentRetryCount),
		CreatedAt:         shared.FormatTimestamptz(booking.CreatedAt),
		UpdatedAt:         shared.FormatTimestamptz(booking.UpdatedAt),
	}
}

func mapBookingListItem(row bookingListRow) BookingListItem {
	return BookingListItem{
		ID:            shared.UUIDToString(row.ID),
		Status:        row.Status,
		BookingType:   row.BookingType,
		CheckIn:       shared.FormatDate(row.CheckIn),
		CheckOut:      shared.FormatDate(row.CheckOut),
		GuestCount:    int(row.GuestCount),
		PropertyTitle: row.PropertyTitle,
		District:      row.District,
		RoomName:      row.RoomName,
		TotalKrw:      int(row.TotalKrw),
		HoldExpiresAt: shared.FormatNullableTimestamptz(row.HoldExpiresAt),
		CreatedAt:     shared.FormatTimestamptz(row.CreatedAt),
	}
}

func mapBookingDetail(row bookingListRow) BookingDetail {
	listItem := mapBookingListItem(row)
	return BookingDetail{
		BookingListItem:   listItem,
		CustomerNotes:     row.CustomerNotes,
		RentKrw:           int(row.RentKrw),
		ServiceFeeKrw:     int(row.ServiceFeeKrw),
		ServiceFeePercent: shared.CalculateServiceFeePercent(int(row.RentKrw), int(row.ServiceFeeKrw)),
		PricingVersion:    row.PricingVersion,
		PropertyID:        shared.UUIDToString(row.PropertyID),
		RoomID:            shared.UUIDToString(row.RoomID),
	}
}
