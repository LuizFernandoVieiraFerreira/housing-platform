import uuid
from dataclasses import dataclass
from datetime import date, datetime
from typing import Any

from sqlalchemy import func, select, text
from sqlalchemy.orm import Session

from housing_platform.db.models import AuditLogs, Bookings, Hosts, HousingRequests, Properties


@dataclass(frozen=True)
class AdminPropertyRow:
    id: uuid.UUID
    title: str
    slug: str
    property_type: str
    district: str
    status: str
    booking_mode: str
    monthly_price_min: int | None
    room_count: int
    updated_at: datetime
    host_display_name: str


@dataclass(frozen=True)
class AdminHostRow:
    id: uuid.UUID
    display_name: str
    status: str
    profile_name: str
    verified_at: datetime | None
    created_at: datetime


@dataclass(frozen=True)
class AdminBookingRow:
    id: uuid.UUID
    status: str
    booking_type: str
    check_in: date
    check_out: date
    guest_count: int
    customer_notes: str | None
    property_title: str
    room_name: str
    total_krw: int
    created_at: datetime


@dataclass(frozen=True)
class AdminPaymentRow:
    id: uuid.UUID
    order_id: uuid.UUID
    booking_id: uuid.UUID
    amount_krw: int
    status: str
    property_title: str | None
    customer_name: str | None
    confirmed_at: datetime | None
    created_at: datetime


@dataclass(frozen=True)
class HousingRequestRow:
    id: uuid.UUID
    email: str
    desired_area: str
    check_in: date | None
    check_out: date | None
    budget_max: int | None
    accommodation_type: str | None
    notes: str | None
    status: str
    created_at: datetime


@dataclass(frozen=True)
class AuditLogRow:
    id: uuid.UUID
    action: str
    entity_type: str
    entity_id: uuid.UUID | None
    actor_name: str
    metadata: dict[str, Any]
    created_at: datetime


class AdminRepository:
    def __init__(self, db: Session) -> None:
        self._db = db

    def get_dashboard_stats(self) -> dict[str, int]:
        pending_properties = self._db.scalar(
            select(func.count())
            .select_from(Properties)
            .where(
                Properties.status == "pending_review",
                Properties.deleted_at.is_(None),
            )
        ) or 0

        pending_hosts = self._db.scalar(
            select(func.count())
            .select_from(Hosts)
            .where(
                Hosts.status == "pending",
                Hosts.deleted_at.is_(None),
            )
        ) or 0

        open_bookings = self._db.scalar(
            select(func.count())
            .select_from(Bookings)
            .where(Bookings.status.in_(["requested", "pending_payment", "payment_failed"]))
        ) or 0

        open_housing_requests = self._db.scalar(
            select(func.count())
            .select_from(HousingRequests)
            .where(HousingRequests.status.in_(["new", "in_progress"]))
        ) or 0

        return {
            "pending_properties": pending_properties,
            "pending_hosts": pending_hosts,
            "open_bookings": open_bookings,
            "open_housing_requests": open_housing_requests,
        }

    def list_properties(self) -> list[AdminPropertyRow]:
        rows = self._db.execute(
            text(
                """
                select
                  p.id,
                  p.title,
                  p.slug,
                  p.property_type::text as property_type,
                  p.district,
                  p.status::text as status,
                  p.booking_mode::text as booking_mode,
                  p.monthly_price_min,
                  coalesce(
                    (
                      select count(*)::integer
                      from public.rooms r
                      where r.property_id = p.id
                        and r.deleted_at is null
                    ),
                    0
                  ) as room_count,
                  p.updated_at,
                  h.display_name as host_display_name
                from public.properties p
                join public.hosts h on h.id = p.host_id
                where p.deleted_at is null
                order by p.updated_at desc
                """
            )
        ).mappings()

        return [
            AdminPropertyRow(
                id=row["id"],
                title=row["title"],
                slug=row["slug"],
                property_type=row["property_type"],
                district=row["district"],
                status=row["status"],
                booking_mode=row["booking_mode"],
                monthly_price_min=row["monthly_price_min"],
                room_count=row["room_count"],
                updated_at=row["updated_at"],
                host_display_name=row["host_display_name"],
            )
            for row in rows
        ]

    def publish_property(self, property_id: uuid.UUID) -> Properties | None:
        updated_id = self._db.scalar(
            text(
                """
                update public.properties
                set
                  status = 'published',
                  published_at = timezone('utc', now())
                where id = :property_id
                  and deleted_at is null
                  and status = 'pending_review'
                returning id
                """
            ),
            {"property_id": property_id},
        )
        if updated_id is None:
            return None
        return self._db.scalar(select(Properties).where(Properties.id == property_id))

    def reject_property_review(self, property_id: uuid.UUID) -> Properties | None:
        updated_id = self._db.scalar(
            text(
                """
                update public.properties
                set status = 'draft'
                where id = :property_id
                  and deleted_at is null
                  and status = 'pending_review'
                returning id
                """
            ),
            {"property_id": property_id},
        )
        if updated_id is None:
            return None
        return self._db.scalar(select(Properties).where(Properties.id == property_id))

    def list_hosts(self) -> list[AdminHostRow]:
        rows = self._db.execute(
            text(
                """
                select
                  h.id,
                  h.display_name,
                  h.status::text as status,
                  p.full_name as profile_name,
                  h.verified_at,
                  h.created_at
                from public.hosts h
                join public.profiles p on p.id = h.profile_id
                where h.deleted_at is null
                order by h.created_at desc
                """
            )
        ).mappings()

        return [
            AdminHostRow(
                id=row["id"],
                display_name=row["display_name"],
                status=row["status"],
                profile_name=row["profile_name"],
                verified_at=row["verified_at"],
                created_at=row["created_at"],
            )
            for row in rows
        ]

    def approve_host(self, host_id: uuid.UUID) -> Hosts | None:
        updated_id = self._db.scalar(
            text(
                """
                update public.hosts
                set
                  status = 'active',
                  verified_at = timezone('utc', now())
                where id = :host_id
                  and deleted_at is null
                  and status = 'pending'
                returning id
                """
            ),
            {"host_id": host_id},
        )
        if updated_id is None:
            return None
        return self._db.scalar(select(Hosts).where(Hosts.id == host_id))

    def list_bookings(self) -> list[AdminBookingRow]:
        rows = self._db.execute(
            text(
                """
                select
                  b.id,
                  b.status::text as status,
                  b.booking_type::text as booking_type,
                  b.check_in,
                  b.check_out,
                  b.guest_count,
                  b.customer_notes,
                  p.title as property_title,
                  r.name as room_name,
                  s.total_krw,
                  b.created_at
                from public.bookings b
                join public.properties p on p.id = b.property_id
                join public.rooms r on r.id = b.room_id
                join public.booking_price_snapshots s on s.booking_id = b.id
                order by b.created_at desc
                """
            )
        ).mappings()

        return [
            AdminBookingRow(
                id=row["id"],
                status=row["status"],
                booking_type=row["booking_type"],
                check_in=row["check_in"],
                check_out=row["check_out"],
                guest_count=row["guest_count"],
                customer_notes=row["customer_notes"],
                property_title=row["property_title"],
                room_name=row["room_name"],
                total_krw=row["total_krw"],
                created_at=row["created_at"],
            )
            for row in rows
        ]

    def list_payments(self) -> list[AdminPaymentRow]:
        rows = self._db.execute(
            text(
                """
                select
                  pay.id,
                  pay.order_id,
                  pay.booking_id,
                  pay.amount_krw,
                  pay.status::text as status,
                  pay.confirmed_at,
                  pay.created_at,
                  prop.title as property_title,
                  prof.full_name as customer_name
                from public.payments pay
                join public.bookings b on b.id = pay.booking_id
                join public.properties prop on prop.id = b.property_id
                join public.profiles prof on prof.id = pay.customer_id
                order by pay.created_at desc
                """
            )
        ).mappings()

        return [
            AdminPaymentRow(
                id=row["id"],
                order_id=row["order_id"],
                booking_id=row["booking_id"],
                amount_krw=row["amount_krw"],
                status=row["status"],
                property_title=row["property_title"],
                customer_name=row["customer_name"],
                confirmed_at=row["confirmed_at"],
                created_at=row["created_at"],
            )
            for row in rows
        ]

    def list_housing_requests(self) -> list[HousingRequestRow]:
        rows = self._db.execute(
            text(
                """
                select
                  id,
                  email,
                  desired_area,
                  check_in,
                  check_out,
                  budget_max,
                  accommodation_type::text as accommodation_type,
                  notes,
                  status::text as status,
                  created_at
                from public.housing_requests
                order by created_at desc
                """
            )
        ).mappings()

        return [
            HousingRequestRow(
                id=row["id"],
                email=row["email"],
                desired_area=row["desired_area"],
                check_in=row["check_in"],
                check_out=row["check_out"],
                budget_max=row["budget_max"],
                accommodation_type=row["accommodation_type"],
                notes=row["notes"],
                status=row["status"],
                created_at=row["created_at"],
            )
            for row in rows
        ]

    def update_housing_request_status(
        self,
        request_id: uuid.UUID,
        status: str,
    ) -> HousingRequests | None:
        request = self._db.scalar(
            select(HousingRequests).where(HousingRequests.id == request_id)
        )
        if request is None:
            return None

        request.status = status
        self._db.flush()
        return request

    def list_audit_logs(self, *, limit: int = 100) -> list[AuditLogRow]:
        rows = self._db.execute(
            text(
                """
                select
                  a.id,
                  a.action,
                  a.entity_type,
                  a.entity_id,
                  a.metadata,
                  a.created_at,
                  p.full_name as actor_name
                from public.audit_logs a
                join public.profiles p on p.id = a.actor_id
                order by a.created_at desc
                limit :limit
                """
            ),
            {"limit": limit},
        ).mappings()

        return [
            AuditLogRow(
                id=row["id"],
                action=row["action"],
                entity_type=row["entity_type"],
                entity_id=row["entity_id"],
                actor_name=row["actor_name"],
                metadata=row["metadata"] or {},
                created_at=row["created_at"],
            )
            for row in rows
        ]

    def write_audit_log(
        self,
        *,
        actor_id: uuid.UUID,
        action: str,
        entity_type: str,
        entity_id: uuid.UUID | None = None,
        metadata: dict[str, Any] | None = None,
    ) -> AuditLogs:
        log = AuditLogs(
            actor_id=actor_id,
            action=action.strip(),
            entity_type=entity_type.strip(),
            entity_id=entity_id,
            metadata_=metadata or {},
        )
        self._db.add(log)
        self._db.flush()
        return log
