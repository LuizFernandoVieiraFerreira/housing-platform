import uuid
from datetime import date, datetime
from typing import Any

from housing_platform.admin.schemas import (
    AdminHost,
    AdminPayment,
    AdminProperty,
    AuditLog,
    HousingRequest,
    HousingRequestStatus,
)
from housing_platform.hosts.mappers import map_host_property_list_item
from housing_platform.payments.schemas import PaymentStatus
from housing_platform.properties.schemas import PropertyStatusChange


def map_admin_property(
    *,
    property_id: uuid.UUID,
    title: str,
    slug: str,
    property_type: str,
    district: str,
    status: str,
    booking_mode: str,
    monthly_price_min: int | None,
    room_count: int,
    updated_at: datetime,
    host_display_name: str,
) -> AdminProperty:
    base = map_host_property_list_item(
        property_id=property_id,
        title=title,
        slug=slug,
        property_type=property_type,
        district=district,
        status=status,
        booking_mode=booking_mode,
        monthly_price_min=monthly_price_min,
        room_count=room_count,
        updated_at=updated_at,
    )
    return AdminProperty(**base.model_dump(), host_display_name=host_display_name)


def map_admin_host(
    *,
    host_id: uuid.UUID,
    display_name: str,
    status: str,
    profile_name: str,
    verified_at: datetime | None,
    created_at: datetime,
) -> AdminHost:
    return AdminHost(
        id=host_id,
        display_name=display_name,
        status=status,
        profile_name=profile_name,
        verified_at=verified_at,
        created_at=created_at,
    )


def map_admin_payment(
    *,
    payment_id: uuid.UUID,
    order_id: uuid.UUID,
    booking_id: uuid.UUID,
    amount_krw: int,
    status: str,
    property_title: str | None,
    customer_name: str | None,
    confirmed_at: datetime | None,
    created_at: datetime,
) -> AdminPayment:
    return AdminPayment(
        id=payment_id,
        order_id=order_id,
        booking_id=booking_id,
        amount_krw=amount_krw,
        status=PaymentStatus(status),
        property_title=property_title,
        customer_name=customer_name,
        confirmed_at=confirmed_at,
        created_at=created_at,
    )


def map_housing_request(
    *,
    request_id: uuid.UUID,
    email: str,
    desired_area: str,
    check_in: date | None,
    check_out: date | None,
    budget_max: int | None,
    accommodation_type: str | None,
    notes: str | None,
    status: str,
    created_at: datetime,
) -> HousingRequest:
    return HousingRequest(
        id=request_id,
        email=email,
        desired_area=desired_area,
        check_in=check_in,
        check_out=check_out,
        budget_max=budget_max,
        accommodation_type=accommodation_type,
        notes=notes,
        status=HousingRequestStatus(status),
        created_at=created_at,
    )


def map_audit_log(
    *,
    log_id: uuid.UUID,
    action: str,
    entity_type: str,
    entity_id: uuid.UUID | None,
    actor_name: str,
    metadata: dict[str, Any],
    created_at: datetime,
) -> AuditLog:
    return AuditLog(
        id=log_id,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        actor_name=actor_name,
        metadata=metadata,
        created_at=created_at,
    )


def map_property_status_change(*, property_id: uuid.UUID, status: str) -> PropertyStatusChange:
    from housing_platform.properties.schemas import PropertyStatus

    return PropertyStatusChange(id=property_id, status=PropertyStatus(status))
