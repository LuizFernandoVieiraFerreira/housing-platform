package payments

type CreatePaymentOrderRequest struct {
	BookingID string `json:"bookingId"`
}

type CreatePaymentOrderResult struct {
	PaymentID  string `json:"paymentId"`
	OrderID    string `json:"orderId"`
	BookingID  string `json:"bookingId"`
	AmountKrw  int    `json:"amountKrw"`
	OrderName  string `json:"orderName"`
}

type ConfirmPaymentRequest struct {
	PaymentKey string `json:"paymentKey"`
	OrderID    string `json:"orderId"`
	Amount     int    `json:"amount"`
}

type ConfirmPaymentResult struct {
	PaymentID string  `json:"paymentId"`
	OrderID   string  `json:"orderId"`
	BookingID *string `json:"bookingId"`
	Status    string  `json:"status"`
}

type TossWebhookPayload struct {
	EventType string         `json:"eventType"`
	CreatedAt string         `json:"createdAt"`
	Data      map[string]any `json:"data"`
}

type WebhookAck struct {
	OK     bool   `json:"ok"`
	Status string `json:"status"`
}
