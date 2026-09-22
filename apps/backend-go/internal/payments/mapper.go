package payments

import (
	"github.com/housing-platform/backend-go/internal/db"
	"github.com/housing-platform/backend-go/internal/shared"
)

func mapCreatePaymentOrderResult(paymentID, orderID, bookingID string, amountKrw int, orderName string) CreatePaymentOrderResult {
	return CreatePaymentOrderResult{
		PaymentID: paymentID,
		OrderID:   orderID,
		BookingID: bookingID,
		AmountKrw: amountKrw,
		OrderName: orderName,
	}
}

func mapConfirmPaymentResult(payment db.Payment, bookingID *string) ConfirmPaymentResult {
	var bookingIDOut *string
	if bookingID != nil {
		bookingIDOut = bookingID
	} else {
		v := shared.UUIDToString(payment.BookingID)
		bookingIDOut = &v
	}
	return ConfirmPaymentResult{
		PaymentID: shared.UUIDToString(payment.ID),
		OrderID:   shared.UUIDToString(payment.OrderID),
		BookingID: bookingIDOut,
		Status:    string(payment.Status),
	}
}
