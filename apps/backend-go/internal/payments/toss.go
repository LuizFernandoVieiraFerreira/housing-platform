package payments

import (
	"bytes"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	apierrors "github.com/housing-platform/backend-go/internal/api/errors"
	"github.com/housing-platform/backend-go/internal/config"
)

const tossAPIBase = "https://api.tosspayments.com/v1"

type TossClientError struct {
	Message string
}

func (e *TossClientError) Error() string {
	return e.Message
}

type TossClient struct {
	secretKey       string
	paymentDevMock  bool
	httpClient      *http.Client
}

func NewTossClient(cfg *config.Config) *TossClient {
	return &TossClient{
		secretKey:      cfg.TossSecretKey,
		paymentDevMock: cfg.PaymentDevMock || cfg.TossSecretKey == "",
		httpClient:     &http.Client{Timeout: 30 * time.Second},
	}
}

func (c *TossClient) IsDevMockEnabled() bool {
	return c.paymentDevMock || c.secretKey == ""
}

func (c *TossClient) HasSecretKey() bool {
	return c.secretKey != ""
}

func (c *TossClient) ConfirmPayment(paymentKey, orderID string, amount int) (map[string]any, error) {
	if c.IsDevMockEnabled() && strings.HasPrefix(paymentKey, "devmock_") {
		return map[string]any{
			"status":      "DONE",
			"paymentKey":  paymentKey,
			"orderId":     orderID,
			"totalAmount": amount,
			"method":      "DEV_MOCK",
		}, nil
	}

	payload := map[string]any{
		"paymentKey": paymentKey,
		"orderId":    orderID,
		"amount":     amount,
	}
	body, _ := json.Marshal(payload)

	req, err := http.NewRequest(http.MethodPost, tossAPIBase+"/payments/confirm", bytes.NewReader(body))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Authorization", c.authHeader())
	req.Header.Set("Content-Type", "application/json")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, &TossClientError{Message: err.Error()}
	}
	defer resp.Body.Close()

	respBody, _ := io.ReadAll(resp.Body)
	var result map[string]any
	if err := json.Unmarshal(respBody, &result); err != nil {
		return nil, &TossClientError{Message: "Invalid Toss response"}
	}
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		message, _ := result["message"].(string)
		if message == "" {
			message = "Toss payment confirmation failed"
		}
		return nil, &TossClientError{Message: message}
	}
	return result, nil
}

func (c *TossClient) FetchPayment(paymentKey string) (map[string]any, error) {
	req, err := http.NewRequest(http.MethodGet, tossAPIBase+"/payments/"+paymentKey, nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Authorization", c.authHeader())

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, &TossClientError{Message: err.Error()}
	}
	defer resp.Body.Close()

	respBody, _ := io.ReadAll(resp.Body)
	var result map[string]any
	if err := json.Unmarshal(respBody, &result); err != nil {
		return nil, &TossClientError{Message: "Invalid Toss response"}
	}
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		message, _ := result["message"].(string)
		if message == "" {
			message = "Unable to fetch Toss payment"
		}
		return nil, &TossClientError{Message: message}
	}
	return result, nil
}

func IsSuccessful(payload map[string]any) bool {
	status, _ := payload["status"].(string)
	return status == "DONE"
}

func IsFailed(payload map[string]any) bool {
	status, _ := payload["status"].(string)
	return status == "ABORTED" || status == "CANCELED" || status == "EXPIRED"
}

func (c *TossClient) authHeader() string {
	if c.secretKey == "" {
		panic(apierrors.ExternalServiceError("TOSS_SECRET_KEY is not configured"))
	}
	encoded := base64.StdEncoding.EncodeToString([]byte(fmt.Sprintf("%s:", c.secretKey)))
	return "Basic " + encoded
}
