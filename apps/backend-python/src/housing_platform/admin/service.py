import uuid

from sqlalchemy.orm import Session

from housing_platform.admin.mappers import (
    map_admin_host,
    map_admin_payment,
    map_admin_property,
    map_audit_log,
    map_housing_request,
    map_property_status_change,
)
from housing_platform.admin.repository import AdminRepository
from housing_platform.admin.schemas import (
    AdminDashboardStats,
    AdminHost,
    AdminPayment,
    AdminProperty,
    AuditLog,
    HousingRequest,
    UpdateHousingRequestStatusRequest,
)
from housing_platform.auth.errors import BadRequestError, NotFoundError
from housing_platform.auth.models import AuthUser
from housing_platform.auth.service import AuthorizationService
from housing_platform.hosts.mappers import map_host, map_host_booking
from housing_platform.hosts.schemas import Host, HostBooking
from housing_platform.properties.schemas import PropertyStatusChange


class AdminService:
    def __init__(
        self,
        db: Session,
        auth_service: AuthorizationService,
        repository: AdminRepository | None = None,
    ) -> None:
        self._db = db
        self._auth = auth_service
        self._repo = repository or AdminRepository(db)

    def get_dashboard_stats(self, user: AuthUser) -> AdminDashboardStats:
        self._auth.require_admin(user)
        stats = self._repo.get_dashboard_stats()
        return AdminDashboardStats(**stats)

    def list_properties(self, user: AuthUser) -> list[AdminProperty]:
        self._auth.require_admin(user)
        rows = self._repo.list_properties()
        return [
            map_admin_property(
                property_id=row.id,
                title=row.title,
                slug=row.slug,
                property_type=row.property_type,
                district=row.district,
                status=row.status,
                booking_mode=row.booking_mode,
                monthly_price_min=row.monthly_price_min,
                room_count=row.room_count,
                updated_at=row.updated_at,
                host_display_name=row.host_display_name,
            )
            for row in rows
        ]

    def publish_property(self, user: AuthUser, property_id: uuid.UUID) -> PropertyStatusChange:
        self._auth.require_admin(user)
        property_row = self._repo.publish_property(property_id)
        if property_row is None:
            raise BadRequestError("Property must be pending review before it can be published")

        self._repo.write_audit_log(
            actor_id=user.id,
            action="property.published",
            entity_type="property",
            entity_id=property_row.id,
            metadata={"title": property_row.title, "slug": property_row.slug},
        )
        self._db.commit()
        return map_property_status_change(property_id=property_row.id, status=property_row.status)

    def reject_property_review(
        self,
        user: AuthUser,
        property_id: uuid.UUID,
    ) -> PropertyStatusChange:
        self._auth.require_admin(user)
        property_row = self._repo.reject_property_review(property_id)
        if property_row is None:
            raise BadRequestError("Property must be pending review before it can be rejected")

        self._repo.write_audit_log(
            actor_id=user.id,
            action="property.review_rejected",
            entity_type="property",
            entity_id=property_row.id,
            metadata={"title": property_row.title, "slug": property_row.slug},
        )
        self._db.commit()
        return map_property_status_change(property_id=property_row.id, status=property_row.status)

    def list_hosts(self, user: AuthUser) -> list[AdminHost]:
        self._auth.require_admin(user)
        rows = self._repo.list_hosts()
        return [
            map_admin_host(
                host_id=row.id,
                display_name=row.display_name,
                status=row.status,
                profile_name=row.profile_name,
                verified_at=row.verified_at,
                created_at=row.created_at,
            )
            for row in rows
        ]

    def approve_host(self, user: AuthUser, host_id: uuid.UUID) -> Host:
        self._auth.require_admin(user)
        host = self._repo.approve_host(host_id)
        if host is None:
            raise BadRequestError("Host must be pending before it can be approved")

        self._repo.write_audit_log(
            actor_id=user.id,
            action="host.approved",
            entity_type="host",
            entity_id=host.id,
            metadata={"display_name": host.display_name},
        )
        self._db.commit()
        self._db.refresh(host)
        return map_host(host)

    def list_bookings(self, user: AuthUser) -> list[HostBooking]:
        self._auth.require_admin(user)
        rows = self._repo.list_bookings()
        return [
            map_host_booking(
                booking_id=row.id,
                status=row.status,
                booking_type=row.booking_type,
                check_in=row.check_in,
                check_out=row.check_out,
                guest_count=row.guest_count,
                customer_notes=row.customer_notes,
                property_title=row.property_title,
                room_name=row.room_name,
                total_krw=row.total_krw,
                created_at=row.created_at,
            )
            for row in rows
        ]

    def list_payments(self, user: AuthUser) -> list[AdminPayment]:
        self._auth.require_admin(user)
        rows = self._repo.list_payments()
        return [
            map_admin_payment(
                payment_id=row.id,
                order_id=row.order_id,
                booking_id=row.booking_id,
                amount_krw=row.amount_krw,
                status=row.status,
                property_title=row.property_title,
                customer_name=row.customer_name,
                confirmed_at=row.confirmed_at,
                created_at=row.created_at,
            )
            for row in rows
        ]

    def list_housing_requests(self, user: AuthUser) -> list[HousingRequest]:
        self._auth.require_admin(user)
        rows = self._repo.list_housing_requests()
        return [
            map_housing_request(
                request_id=row.id,
                email=row.email,
                desired_area=row.desired_area,
                check_in=row.check_in,
                check_out=row.check_out,
                budget_max=row.budget_max,
                accommodation_type=row.accommodation_type,
                notes=row.notes,
                status=row.status,
                created_at=row.created_at,
            )
            for row in rows
        ]

    def update_housing_request_status(
        self,
        user: AuthUser,
        request_id: uuid.UUID,
        request: UpdateHousingRequestStatusRequest,
    ) -> HousingRequest:
        self._auth.require_admin(user)
        updated = self._repo.update_housing_request_status(request_id, request.status.value)
        if updated is None:
            raise NotFoundError("Housing request not found")

        self._repo.write_audit_log(
            actor_id=user.id,
            action="housing_request.status_updated",
            entity_type="housing_request",
            entity_id=updated.id,
            metadata={"status": updated.status},
        )
        self._db.commit()
        self._db.refresh(updated)
        return map_housing_request(
            request_id=updated.id,
            email=updated.email,
            desired_area=updated.desired_area,
            check_in=updated.check_in,
            check_out=updated.check_out,
            budget_max=updated.budget_max,
            accommodation_type=updated.accommodation_type,
            notes=updated.notes,
            status=updated.status,
            created_at=updated.created_at,
        )

    def list_audit_logs(self, user: AuthUser) -> list[AuditLog]:
        self._auth.require_admin(user)
        rows = self._repo.list_audit_logs()
        return [
            map_audit_log(
                log_id=row.id,
                action=row.action,
                entity_type=row.entity_type,
                entity_id=row.entity_id,
                actor_name=row.actor_name,
                metadata=row.metadata,
                created_at=row.created_at,
            )
            for row in rows
        ]
