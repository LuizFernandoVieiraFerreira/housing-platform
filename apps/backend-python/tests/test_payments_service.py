from unittest.mock import MagicMock
from uuid import uuid4

import pytest

from housing_platform.auth.errors import (
    ExternalServiceError,
    ForbiddenError,
    NotFoundError,
    PaymentAmountMismatchError,
    PaymentFailedError,
)
from housing_platform.auth.models import AuthUser, UserRole
from housing_platform.payments.repository import PaymentLookupRow, PaymentOrderRow
from housing_platform.payments.schemas import (
    ConfirmPaymentRequest,
    CreatePaymentOrderRequest,
    PaymentStatus,
    TossWebhookPayload,
    WebhookAckStatus,
)
from housing_platform.payments.service import PaymentService
from housing_platform.payments.toss_client import TossClient, TossClientError


def _user() -> AuthUser:
    return AuthUser(id=uuid4(), email="guest@example.com", role=UserRole.CUSTOMER)


def _order_row() -> PaymentOrderRow:
    booking_id = uuid4()
    return PaymentOrderRow(
        payment_id=uuid4(),
        order_id=uuid4(),
        booking_id=booking_id,
        amount_krw=1_023_000,
        order_name="Test Property",
    )


def test_create_payment_order_commits_transaction() -> None:
    db = MagicMock()
    repo = MagicMock(unsafe=True)
    order = _order_row()
    repo.create_payment_order.return_value = order
    service = PaymentService(db, repository=repo)
    user = _user()

    result = service.create_payment_order(
        user,
        CreatePaymentOrderRequest(bookingId=order.booking_id),
    )

    assert result.payment_id == order.payment_id
    assert result.order_name == "Test Property"
    repo.assert_rate_limit.assert_called_once_with(f"create-payment:{user.id}", 20, 60)
    db.commit.assert_called_once()


def test_confirm_payment_requires_owner() -> None:
    db = MagicMock()
    repo = MagicMock(unsafe=True)
    order_id = uuid4()
    repo.get_payment_by_order_id.return_value = PaymentLookupRow(
        id=uuid4(),
        order_id=order_id,
        booking_id=uuid4(),
        customer_id=uuid4(),
        amount_krw=1_023_000,
        status="pending",
    )
    service = PaymentService(db, repository=repo, toss_client=MagicMock(unsafe=True))

    with pytest.raises(ForbiddenError, match="cannot confirm"):
        service.confirm_payment(
            _user(),
            ConfirmPaymentRequest(
                paymentKey="pay_key",
                orderId=order_id,
                amount=1_023_000,
            ),
        )


def test_confirm_payment_rejects_amount_mismatch() -> None:
    user = _user()
    db = MagicMock()
    repo = MagicMock(unsafe=True)
    order_id = uuid4()
    repo.get_payment_by_order_id.return_value = PaymentLookupRow(
        id=uuid4(),
        order_id=order_id,
        booking_id=uuid4(),
        customer_id=user.id,
        amount_krw=1_023_000,
        status="pending",
    )
    service = PaymentService(db, repository=repo, toss_client=MagicMock(unsafe=True))

    with pytest.raises(PaymentAmountMismatchError):
        service.confirm_payment(
            user,
            ConfirmPaymentRequest(
                paymentKey="pay_key",
                orderId=order_id,
                amount=999,
            ),
        )


def test_confirm_payment_is_idempotent_when_already_confirmed() -> None:
    user = _user()
    db = MagicMock()
    repo = MagicMock(unsafe=True)
    order_id = uuid4()
    payment_id = uuid4()
    repo.get_payment_by_order_id.return_value = PaymentLookupRow(
        id=payment_id,
        order_id=order_id,
        booking_id=uuid4(),
        customer_id=user.id,
        amount_krw=1_023_000,
        status="confirmed",
    )
    service = PaymentService(db, repository=repo, toss_client=MagicMock(unsafe=True))

    result = service.confirm_payment(
        user,
        ConfirmPaymentRequest(
            paymentKey="pay_key",
            orderId=order_id,
            amount=1_023_000,
        ),
    )

    assert result.payment_id == payment_id
    assert result.booking_id is None
    assert result.status == PaymentStatus.CONFIRMED


def test_confirm_payment_marks_failed_when_toss_rejects() -> None:
    user = _user()
    db = MagicMock()
    repo = MagicMock(unsafe=True)
    toss = MagicMock(unsafe=True)
    order_id = uuid4()
    repo.get_payment_by_order_id.return_value = PaymentLookupRow(
        id=uuid4(),
        order_id=order_id,
        booking_id=uuid4(),
        customer_id=user.id,
        amount_krw=1_023_000,
        status="pending",
    )
    toss.confirm_payment.side_effect = TossClientError("Card declined")
    service = PaymentService(db, repository=repo, toss_client=toss)

    with pytest.raises(PaymentFailedError, match="Card declined"):
        service.confirm_payment(
            user,
            ConfirmPaymentRequest(
                paymentKey="pay_key",
                orderId=order_id,
                amount=1_023_000,
            ),
        )

    repo.mark_payment_failed.assert_called_once()
    db.commit.assert_called_once()


def test_confirm_payment_finalizes_successful_toss_response() -> None:
    user = _user()
    db = MagicMock()
    repo = MagicMock(unsafe=True)
    toss = MagicMock(unsafe=True)
    order_id = uuid4()
    payment_id = uuid4()
    booking_id = uuid4()
    repo.get_payment_by_order_id.return_value = PaymentLookupRow(
        id=payment_id,
        order_id=order_id,
        booking_id=booking_id,
        customer_id=user.id,
        amount_krw=1_023_000,
        status="pending",
    )
    toss.confirm_payment.return_value = {"status": "DONE", "totalAmount": 1_023_000}
    toss.is_successful.return_value = True
    finalized = MagicMock()
    finalized.id = payment_id
    finalized.order_id = order_id
    finalized.booking_id = booking_id
    finalized.status = "confirmed"
    repo.finalize_successful_payment.return_value = finalized
    service = PaymentService(db, repository=repo, toss_client=toss)

    result = service.confirm_payment(
        user,
        ConfirmPaymentRequest(
            paymentKey="devmock_test",
            orderId=order_id,
            amount=1_023_000,
        ),
    )

    assert result.status == PaymentStatus.CONFIRMED
    assert result.booking_id == booking_id
    db.commit.assert_called_once()


def test_webhook_confirms_successful_payment() -> None:
    db = MagicMock()
    repo = MagicMock(unsafe=True)
    toss = TossClient(secret_key="test_secret", payment_dev_mock=False)
    order_id = uuid4()
    payment_id = uuid4()
    booking_id = uuid4()
    repo.get_payment_by_order_id.return_value = PaymentLookupRow(
        id=payment_id,
        order_id=order_id,
        booking_id=booking_id,
        customer_id=uuid4(),
        amount_krw=1_023_000,
        status="pending",
    )
    toss.fetch_payment = MagicMock(return_value={"status": "DONE", "totalAmount": 1_023_000})  # type: ignore[method-assign]
    finalized = MagicMock()
    finalized.id = payment_id
    finalized.order_id = order_id
    finalized.booking_id = booking_id
    finalized.status = "confirmed"
    repo.finalize_successful_payment.return_value = finalized
    service = PaymentService(db, repository=repo, toss_client=toss)

    result = service.receive_webhook(
        TossWebhookPayload(
            eventType="PAYMENT_STATUS_CHANGED",
            createdAt="2026-09-21T00:00:00Z",
            data={"paymentKey": "pay_key", "orderId": str(order_id)},
        )
    )

    assert result.ok is True
    assert result.status == WebhookAckStatus.CONFIRMED
    repo.record_payment_event.assert_called_once()


def test_webhook_returns_external_service_error_when_toss_unavailable() -> None:
    db = MagicMock()
    repo = MagicMock(unsafe=True)
    toss = TossClient(secret_key="test_secret", payment_dev_mock=False)
    order_id = uuid4()
    repo.get_payment_by_order_id.return_value = PaymentLookupRow(
        id=uuid4(),
        order_id=order_id,
        booking_id=uuid4(),
        customer_id=uuid4(),
        amount_krw=1_023_000,
        status="pending",
    )
    toss.fetch_payment = MagicMock(side_effect=TossClientError("Toss unavailable"))  # type: ignore[method-assign]
    service = PaymentService(db, repository=repo, toss_client=toss)

    with pytest.raises(ExternalServiceError, match="Toss unavailable"):
        service.receive_webhook(
            TossWebhookPayload(
                eventType="PAYMENT_STATUS_CHANGED",
                data={"paymentKey": "pay_key", "orderId": str(order_id)},
            )
        )


def test_webhook_not_found_for_unknown_order() -> None:
    db = MagicMock()
    repo = MagicMock(unsafe=True)
    repo.get_payment_by_order_id.return_value = None
    toss = TossClient(secret_key="test_secret", payment_dev_mock=False)
    service = PaymentService(db, repository=repo, toss_client=toss)

    with pytest.raises(NotFoundError):
        service.receive_webhook(
            TossWebhookPayload(
                data={"paymentKey": "pay_key", "orderId": str(uuid4())},
            )
        )
