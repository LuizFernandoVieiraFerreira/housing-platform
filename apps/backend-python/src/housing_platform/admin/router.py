from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from housing_platform.admin.schemas import (
    AdminDashboardStats,
    AdminHost,
    AdminPayment,
    AdminProperty,
    AuditLog,
    HousingRequest,
    UpdateHousingRequestStatusRequest,
)
from housing_platform.admin.service import AdminService
from housing_platform.auth.dependencies import get_auth_service, require_admin
from housing_platform.auth.models import AuthUser
from housing_platform.auth.service import AuthorizationService
from housing_platform.db.session import get_db
from housing_platform.hosts.schemas import Host, HostBooking
from housing_platform.properties.schemas import PropertyStatusChange

router = APIRouter(prefix="/admin", tags=["Admin"])


def get_admin_service(
    db: Session = Depends(get_db),
    auth_service: AuthorizationService = Depends(get_auth_service),
) -> AdminService:
    return AdminService(db, auth_service)


@router.get("/stats", response_model=AdminDashboardStats)
def get_admin_stats(
    user: Annotated[AuthUser, Depends(require_admin)],
    service: AdminService = Depends(get_admin_service),
) -> AdminDashboardStats:
    return service.get_dashboard_stats(user)


@router.get("/properties", response_model=list[AdminProperty])
def list_admin_properties(
    user: Annotated[AuthUser, Depends(require_admin)],
    service: AdminService = Depends(get_admin_service),
) -> list[AdminProperty]:
    return service.list_properties(user)


@router.post("/properties/{property_id}/publish", response_model=PropertyStatusChange)
def publish_property(
    property_id: UUID,
    user: Annotated[AuthUser, Depends(require_admin)],
    service: AdminService = Depends(get_admin_service),
) -> PropertyStatusChange:
    return service.publish_property(user, property_id)


@router.post("/properties/{property_id}/reject", response_model=PropertyStatusChange)
def reject_property_review(
    property_id: UUID,
    user: Annotated[AuthUser, Depends(require_admin)],
    service: AdminService = Depends(get_admin_service),
) -> PropertyStatusChange:
    return service.reject_property_review(user, property_id)


@router.get("/hosts", response_model=list[AdminHost])
def list_admin_hosts(
    user: Annotated[AuthUser, Depends(require_admin)],
    service: AdminService = Depends(get_admin_service),
) -> list[AdminHost]:
    return service.list_hosts(user)


@router.post("/hosts/{host_id}/approve", response_model=Host)
def approve_host(
    host_id: UUID,
    user: Annotated[AuthUser, Depends(require_admin)],
    service: AdminService = Depends(get_admin_service),
) -> Host:
    return service.approve_host(user, host_id)


@router.get("/bookings", response_model=list[HostBooking])
def list_admin_bookings(
    user: Annotated[AuthUser, Depends(require_admin)],
    service: AdminService = Depends(get_admin_service),
) -> list[HostBooking]:
    return service.list_bookings(user)


@router.get("/payments", response_model=list[AdminPayment])
def list_admin_payments(
    user: Annotated[AuthUser, Depends(require_admin)],
    service: AdminService = Depends(get_admin_service),
) -> list[AdminPayment]:
    return service.list_payments(user)


@router.get("/housing-requests", response_model=list[HousingRequest])
def list_housing_requests(
    user: Annotated[AuthUser, Depends(require_admin)],
    service: AdminService = Depends(get_admin_service),
) -> list[HousingRequest]:
    return service.list_housing_requests(user)


@router.patch("/housing-requests/{request_id}", response_model=HousingRequest)
def update_housing_request_status(
    request_id: UUID,
    request: UpdateHousingRequestStatusRequest,
    user: Annotated[AuthUser, Depends(require_admin)],
    service: AdminService = Depends(get_admin_service),
) -> HousingRequest:
    return service.update_housing_request_status(user, request_id, request)


@router.get("/audit-logs", response_model=list[AuditLog])
def list_audit_logs(
    user: Annotated[AuthUser, Depends(require_admin)],
    service: AdminService = Depends(get_admin_service),
) -> list[AuditLog]:
    return service.list_audit_logs(user)
