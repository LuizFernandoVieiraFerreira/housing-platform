from __future__ import annotations

from datetime import UTC, date, datetime
from typing import Any
from unittest.mock import MagicMock
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient

from housing_platform.admin.router import get_admin_service
from housing_platform.admin.service import AdminService
from housing_platform.auth.errors import ForbiddenError
from housing_platform.auth.models import AuthUser
from housing_platform.auth.service import AuthorizationService
from housing_platform.bookings.repository import BookingListRow
from housing_platform.bookings.router import get_booking_service
from housing_platform.bookings.service import BookingService
from housing_platform.config import settings
from housing_platform.db.models import Bookings, Notifications, Profiles, Properties
from housing_platform.notifications.router import get_notification_service
from housing_platform.notifications.service import NotificationService
from housing_platform.payments.repository import PaymentLookupRow
from housing_platform.payments.router import get_payment_service
from housing_platform.payments.service import PaymentService
from housing_platform.profile.router import get_profile_service
from housing_platform.profile.service import ProfileService
from housing_platform.properties.router import get_property_service
from housing_platform.properties.service import PropertyService
from tests.conftest import make_client
from tests.support.contract import assert_error_envelope

API = settings.api_prefix


def _host_property_payload() -> dict[str, Any]:
    return {
        "title": "Cozy Studio in Hongdae",
        "description": "A bright studio close to the subway with everything you need.",
        "propertyType": "studio",
        "addressLine1": "123 Test Street",
        "city": "Seoul",
        "district": "Mapo-gu",
        "bookingMode": "request",
        "minStayNights": 30,
    }


def _profile_row(*, profile_id=None, role: str = "customer") -> Profiles:
    return Profiles(
        id=profile_id or uuid4(),
        role=role,
        full_name="Jane Doe",
        phone=None,
        preferred_language="en",
        marketing_consent=False,
        created_at=datetime.now(UTC),
        updated_at=datetime.now(UTC),
    )


def _property_row(*, status: str = "draft") -> Properties:
    return Properties(
        id=uuid4(),
        host_id=uuid4(),
        title="Test Property",
        slug="test-property",
        description="A valid property description for testing.",
        property_type="studio",
        address_line1="123 Test Street",
        city="Seoul",
        country="KR",
        district="Mapo-gu",
        status=status,
        booking_mode="request",
        min_stay_nights=30,
        is_featured=False,
        tags=[],
        embedding_sync_attempts=0,
    )


def _booking_row(*, status: str = "requested", customer_id=None) -> Bookings:
    return Bookings(
        id=uuid4(),
        customer_id=customer_id or uuid4(),
        room_id=uuid4(),
        property_id=uuid4(),
        check_in=date(2026, 10, 1),
        check_out=date(2026, 11, 1),
        guest_count=1,
        status=status,
        booking_type="request",
        payment_retry_count=0,
        created_at=datetime.now(UTC),
        updated_at=datetime.now(UTC),
    )


def _booking_list_row(*, customer_id=None) -> BookingListRow:
    return BookingListRow(
        id=uuid4(),
        customer_id=customer_id or uuid4(),
        status="requested",
        booking_type="request",
        check_in=date(2026, 10, 1),
        check_out=date(2026, 11, 1),
        guest_count=1,
        hold_expires_at=None,
        created_at=datetime.now(UTC),
        customer_notes=None,
        property_id=uuid4(),
        room_id=uuid4(),
        property_title="Test Property",
        district="Mapo-gu",
        room_name="Room A",
        rent_krw=930_000,
        service_fee_krw=93_000,
        total_krw=1_023_000,
        pricing_version="v1",
    )


def _non_admin_db() -> MagicMock:
    db = MagicMock()
    db.scalar.return_value = False
    return db


class TestAnonymousAccess:
    @pytest.mark.parametrize(
        "method,path",
        [
            ("get", f"{API}/admin/stats"),
            ("get", f"{API}/admin/properties"),
            ("post", f"{API}/admin/properties/{uuid4()}/publish"),
            ("post", f"{API}/admin/properties/{uuid4()}/reject"),
            ("post", f"{API}/admin/hosts/{uuid4()}/approve"),
            ("get", f"{API}/admin/audit-logs"),
            ("patch", f"{API}/admin/housing-requests/{uuid4()}"),
        ],
    )
    def test_admin_routes_require_authentication(
        self,
        api_client: TestClient,
        method: str,
        path: str,
    ) -> None:
        response = api_client.request(method, path, json={"status": "closed"})

        assert response.status_code == 401
        assert_error_envelope(response.json())
        assert response.json()["error"]["code"] == "UNAUTHENTICATED"


class TestPropertyVisibility:
    def test_draft_property_is_not_found_on_public_route(self) -> None:
        property_id = uuid4()
        db = MagicMock()
        repo = MagicMock()
        repo.get_published_property.return_value = None
        service = PropertyService(db, AuthorizationService(db), repository=repo)

        with make_client(overrides={get_property_service: lambda: service}) as client:
            response = client.get(f"{API}/properties/{property_id}")

        assert response.status_code == 404
        assert_error_envelope(response.json())
        assert response.json()["error"]["code"] == "NOT_FOUND"

    def test_search_delegates_to_repository_without_auth(self) -> None:
        db = MagicMock()
        repo = MagicMock()
        repo.search.return_value = []
        service = PropertyService(db, AuthorizationService(db), repository=repo)

        with make_client(overrides={get_property_service: lambda: service}) as client:
            response = client.get(f"{API}/properties")

        assert response.status_code == 200
        assert response.json() == {"items": [], "totalCount": 0}
        repo.search.assert_called_once()


class TestNonHostPropertyMutations:
    def test_customer_cannot_update_property(self, customer: AuthUser) -> None:
        property_id = uuid4()
        db = MagicMock()
        auth = MagicMock(spec=AuthorizationService)
        auth.is_admin.return_value = False
        auth.is_host_of_property.return_value = False
        repo = MagicMock()
        repo.get_host_property.return_value = _property_row(status="draft")
        service = PropertyService(db, auth, repository=repo)

        with make_client(customer, overrides={get_property_service: lambda: service}) as client:
            response = client.patch(
                f"{API}/properties/{property_id}",
                json=_host_property_payload(),
            )

        assert response.status_code == 403
        assert_error_envelope(response.json())
        assert response.json()["error"]["code"] == "FORBIDDEN"

    def test_customer_cannot_set_property_location(self, customer: AuthUser) -> None:
        property_id = uuid4()
        db = MagicMock()
        auth = MagicMock(spec=AuthorizationService)
        auth.is_admin.return_value = False
        auth.is_host_of_property.return_value = False
        repo = MagicMock()
        repo.get_host_property.return_value = _property_row(status="draft")
        service = PropertyService(db, auth, repository=repo)

        with make_client(customer, overrides={get_property_service: lambda: service}) as client:
            response = client.post(
                f"{API}/properties/{property_id}/location",
                json={"latitude": 37.55, "longitude": 126.92},
            )

        assert response.status_code == 403
        assert response.json()["error"]["code"] == "FORBIDDEN"

    def test_customer_cannot_submit_property_for_review(self, customer: AuthUser) -> None:
        property_id = uuid4()
        db = MagicMock()
        auth = MagicMock(spec=AuthorizationService)
        auth.require_host_of_property.side_effect = ForbiddenError(
            "Only the host of this property can perform this action"
        )
        service = PropertyService(db, auth, repository=MagicMock())

        with make_client(customer, overrides={get_property_service: lambda: service}) as client:
            response = client.post(f"{API}/properties/{property_id}/submit-review")

        assert response.status_code == 403
        assert response.json()["error"]["code"] == "FORBIDDEN"


class TestHostPropertyMutations:
    def test_host_cannot_update_published_property(self, host: AuthUser) -> None:
        property_id = uuid4()
        db = MagicMock()
        auth = MagicMock(spec=AuthorizationService)
        auth.is_admin.return_value = False
        auth.is_host_of_property.return_value = True
        repo = MagicMock()
        repo.get_host_property.return_value = _property_row(status="published")
        service = PropertyService(db, auth, repository=repo)

        with make_client(host, overrides={get_property_service: lambda: service}) as client:
            response = client.patch(
                f"{API}/properties/{property_id}",
                json=_host_property_payload(),
            )

        assert response.status_code == 400
        assert response.json()["error"]["code"] == "VALIDATION_ERROR"


class TestBookingAuthorization:
    def test_customer_cannot_view_another_customers_booking(self, customer: AuthUser) -> None:
        booking_id = uuid4()
        db = MagicMock()
        auth = MagicMock(spec=AuthorizationService)
        auth.is_admin.return_value = False
        auth.is_host_of_property.return_value = False
        repo = MagicMock()
        repo.get_booking_detail_row.return_value = _booking_list_row()
        service = BookingService(db, auth, repository=repo)

        with make_client(customer, overrides={get_booking_service: lambda: service}) as client:
            response = client.get(f"{API}/bookings/{booking_id}")

        assert response.status_code == 403
        assert response.json()["error"]["code"] == "FORBIDDEN"

    def test_customer_cannot_cancel_another_customers_booking(self, customer: AuthUser) -> None:
        booking_id = uuid4()
        db = MagicMock()
        repo = MagicMock()
        repo.get_booking.return_value = _booking_row(status="requested")
        service = BookingService(db, AuthorizationService(db), repository=repo)

        with make_client(customer, overrides={get_booking_service: lambda: service}) as client:
            response = client.post(f"{API}/bookings/{booking_id}/cancel")

        assert response.status_code == 403
        assert response.json()["error"]["code"] == "FORBIDDEN"

    def test_customer_cannot_cancel_confirmed_booking(self, customer: AuthUser) -> None:
        booking_id = uuid4()
        booking = _booking_row(status="confirmed", customer_id=customer.id)
        db = MagicMock()
        repo = MagicMock()
        repo.get_booking.return_value = booking
        repo.cancel_booking.return_value = None
        service = BookingService(db, AuthorizationService(db), repository=repo)

        with make_client(customer, overrides={get_booking_service: lambda: service}) as client:
            response = client.post(f"{API}/bookings/{booking_id}/cancel")

        assert response.status_code == 400
        assert response.json()["error"]["code"] == "VALIDATION_ERROR"

    def test_customer_cannot_approve_booking(self, customer: AuthUser) -> None:
        booking_id = uuid4()
        db = MagicMock()
        auth = MagicMock(spec=AuthorizationService)
        auth.require_host_of_booking.side_effect = ForbiddenError(
            "Only the host of this booking can perform this action"
        )
        repo = MagicMock(unsafe=True)
        repo.get_booking.return_value = _booking_row()
        service = BookingService(db, auth, repository=repo)

        with make_client(customer, overrides={get_booking_service: lambda: service}) as client:
            response = client.post(f"{API}/bookings/{booking_id}/approve")

        assert response.status_code == 403
        assert response.json()["error"]["code"] == "FORBIDDEN"


class TestPaymentAuthorization:
    def test_customer_cannot_create_payment_order_for_foreign_booking(
        self,
        customer: AuthUser,
    ) -> None:
        db = MagicMock()
        repo = MagicMock(unsafe=True)
        repo.create_payment_order.side_effect = ForbiddenError("Booking not found")
        service = PaymentService(db, repository=repo)

        with make_client(customer, overrides={get_payment_service: lambda: service}) as client:
            response = client.post(
                f"{API}/payments/orders",
                json={"bookingId": str(uuid4())},
            )

        assert response.status_code == 403
        assert response.json()["error"]["code"] == "FORBIDDEN"

    def test_customer_cannot_confirm_foreign_payment(self, customer: AuthUser) -> None:
        order_id = uuid4()
        db = MagicMock()
        repo = MagicMock(unsafe=True)
        repo.get_payment_by_order_id.return_value = PaymentLookupRow(
            id=uuid4(),
            order_id=order_id,
            booking_id=uuid4(),
            customer_id=uuid4(),
            amount_krw=1_023_000,
            status="pending",
        )
        service = PaymentService(db, repository=repo, toss_client=MagicMock(unsafe=True))

        with make_client(customer, overrides={get_payment_service: lambda: service}) as client:
            response = client.post(
                f"{API}/payments/confirm",
                json={
                    "paymentKey": "pay_key",
                    "orderId": str(order_id),
                    "amount": 1_023_000,
                },
            )

        assert response.status_code == 403
        assert response.json()["error"]["code"] == "FORBIDDEN"

    def test_confirm_payment_is_not_found_for_unknown_order(self, customer: AuthUser) -> None:
        order_id = uuid4()
        db = MagicMock()
        repo = MagicMock(unsafe=True)
        repo.get_payment_by_order_id.return_value = None
        service = PaymentService(db, repository=repo, toss_client=MagicMock(unsafe=True))

        with make_client(customer, overrides={get_payment_service: lambda: service}) as client:
            response = client.post(
                f"{API}/payments/confirm",
                json={
                    "paymentKey": "pay_key",
                    "orderId": str(order_id),
                    "amount": 1_023_000,
                },
            )

        assert response.status_code == 404
        assert response.json()["error"]["code"] == "NOT_FOUND"


class TestAdminAuthorization:
    @pytest.mark.parametrize(
        "method,path,json_body",
        [
            ("get", f"{API}/admin/stats", None),
            ("get", f"{API}/admin/properties", None),
            ("post", f"{API}/admin/properties/{uuid4()}/publish", None),
            ("post", f"{API}/admin/properties/{uuid4()}/reject", None),
            ("post", f"{API}/admin/hosts/{uuid4()}/approve", None),
            ("get", f"{API}/admin/audit-logs", None),
            (
                "patch",
                f"{API}/admin/housing-requests/{uuid4()}",
                {"status": "closed"},
            ),
        ],
    )
    def test_non_admin_is_forbidden(
        self,
        customer: AuthUser,
        method: str,
        path: str,
        json_body: dict[str, Any] | None,
    ) -> None:
        with make_client(customer, db_factory=_non_admin_db) as client:
            response = client.request(method, path, json=json_body)

        assert response.status_code == 403
        assert_error_envelope(response.json())
        assert response.json()["error"]["code"] == "FORBIDDEN"

    def test_admin_service_rejects_customer_before_repository(self, customer: AuthUser) -> None:
        db = MagicMock()
        auth = AuthorizationService(db)
        auth.is_admin = MagicMock(return_value=False)  # type: ignore[method-assign]
        service = AdminService(db, auth, repository=MagicMock())

        with make_client(customer, overrides={get_admin_service: lambda: service}) as client:
            response = client.get(f"{API}/admin/stats")

        assert response.status_code == 403
        assert response.json()["error"]["code"] == "FORBIDDEN"


class TestNotificationAuthorization:
    def test_customer_cannot_mark_another_users_notification_read(
        self,
        customer: AuthUser,
    ) -> None:
        notification_id = uuid4()
        db = MagicMock()
        repo = MagicMock()
        repo.mark_read.return_value = None
        service = NotificationService(db, repository=repo)

        with make_client(
            customer,
            overrides={get_notification_service: lambda: service},
        ) as client:
            response = client.post(f"{API}/notifications/{notification_id}/read")

        assert response.status_code == 404
        assert response.json()["error"]["code"] == "NOT_FOUND"

    def test_mark_read_scopes_to_authenticated_user(self, customer: AuthUser) -> None:
        notification_id = uuid4()
        db = MagicMock()
        repo = MagicMock()
        notification = Notifications(
            id=notification_id,
            user_id=customer.id,
            type="booking_request",
            title="New booking request",
            body="A guest requested a booking.",
            metadata_={},
            created_at=datetime.now(UTC),
        )
        repo.mark_read.return_value = notification
        service = NotificationService(db, repository=repo)

        with make_client(
            customer,
            overrides={get_notification_service: lambda: service},
        ) as client:
            response = client.post(f"{API}/notifications/{notification_id}/read")

        assert response.status_code == 200
        repo.mark_read.assert_called_once_with(customer.id, notification_id)


class TestProfileAuthorization:
    def test_update_profile_request_does_not_accept_role(self) -> None:
        from housing_platform.profile.schemas import UpdateProfileRequest

        request = UpdateProfileRequest.model_validate(
            {
                "fullName": "Jane Doe",
                "preferredLanguage": "en",
                "marketingConsent": False,
                "role": "admin",
            }
        )

        assert "role" not in request.model_dump()

    def test_update_profile_keeps_existing_role(self, customer: AuthUser) -> None:
        db = MagicMock()
        repo = MagicMock()
        updated = _profile_row(profile_id=customer.id, role="customer")
        repo.update.return_value = updated
        service = ProfileService(db, repository=repo)

        with make_client(customer, overrides={get_profile_service: lambda: service}) as client:
            response = client.patch(
                f"{API}/profile",
                json={
                    "fullName": "Jane Smith",
                    "preferredLanguage": "en",
                    "marketingConsent": True,
                },
            )

        assert response.status_code == 200
        assert response.json()["role"] == "customer"
        repo.update.assert_called_once()
