import base64
from typing import Any

import httpx

from housing_platform.config import settings

TOSS_API_BASE = "https://api.tosspayments.com/v1"


class TossClientError(Exception):
    pass


class TossClient:
    def __init__(
        self,
        *,
        secret_key: str | None = None,
        payment_dev_mock: bool | None = None,
        http_client: httpx.Client | None = None,
    ) -> None:
        self._secret_key = secret_key if secret_key is not None else settings.toss_secret_key
        self._payment_dev_mock = (
            payment_dev_mock if payment_dev_mock is not None else settings.payment_dev_mock
        )
        self._http = http_client or httpx.Client(timeout=30.0)

    def is_dev_mock_enabled(self) -> bool:
        return self._payment_dev_mock or len(self._secret_key) == 0

    def has_secret_key(self) -> bool:
        return len(self._secret_key) > 0

    def confirm_payment(
        self,
        *,
        payment_key: str,
        order_id: str,
        amount: int,
    ) -> dict[str, Any]:
        if self.is_dev_mock_enabled() and payment_key.startswith("devmock_"):
            return {
                "status": "DONE",
                "paymentKey": payment_key,
                "orderId": order_id,
                "totalAmount": amount,
                "method": "DEV_MOCK",
            }

        response = self._http.post(
            f"{TOSS_API_BASE}/payments/confirm",
            headers={
                "Authorization": self._auth_header(),
                "Content-Type": "application/json",
            },
            json={
                "paymentKey": payment_key,
                "orderId": order_id,
                "amount": amount,
            },
        )
        payload = response.json()
        if not response.is_success:
            message = payload.get("message", "Toss payment confirmation failed")
            raise TossClientError(str(message))
        return payload

    def fetch_payment(self, payment_key: str) -> dict[str, Any]:
        response = self._http.get(
            f"{TOSS_API_BASE}/payments/{payment_key}",
            headers={"Authorization": self._auth_header()},
        )
        payload = response.json()
        if not response.is_success:
            message = payload.get("message", "Unable to fetch Toss payment")
            raise TossClientError(str(message))
        return payload

    @staticmethod
    def is_successful(payload: dict[str, Any]) -> bool:
        return payload.get("status") == "DONE"

    @staticmethod
    def is_failed(payload: dict[str, Any]) -> bool:
        status = payload.get("status")
        return status in ("ABORTED", "CANCELED", "EXPIRED")

    def _auth_header(self) -> str:
        if not self._secret_key:
            msg = "TOSS_SECRET_KEY is not configured"
            raise TossClientError(msg)
        encoded = base64.b64encode(f"{self._secret_key}:".encode()).decode()
        return f"Basic {encoded}"
