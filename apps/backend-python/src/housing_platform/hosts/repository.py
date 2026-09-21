import uuid
from dataclasses import dataclass
from datetime import date, datetime

from sqlalchemy import select, text
from sqlalchemy.orm import Session

from housing_platform.db.models import Hosts, Profiles, Properties


@dataclass(frozen=True)
class HostPropertyListRow:
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


@dataclass(frozen=True)
class HostBookingRow:
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


class HostRepository:
    def __init__(self, db: Session) -> None:
        self._db = db

    def get_by_profile_id(self, profile_id: uuid.UUID) -> Hosts | None:
        return self._db.scalar(
            select(Hosts).where(
                Hosts.profile_id == profile_id,
                Hosts.deleted_at.is_(None),
            )
        )

    def register(self, profile_id: uuid.UUID, display_name: str) -> Hosts:
        existing = self.get_by_profile_id(profile_id)
        if existing is not None:
            return existing

        self._db.execute(text("alter table public.profiles disable trigger profiles_protect_role"))
        try:
            self._db.execute(
                text(
                    """
                    update public.profiles
                    set role = 'host'
                    where id = :profile_id
                    """
                ),
                {"profile_id": profile_id},
            )

            host = Hosts(
                profile_id=profile_id,
                display_name=display_name.strip(),
                status="pending",
            )
            self._db.add(host)
            self._db.flush()
        finally:
            self._db.execute(
                text("alter table public.profiles enable trigger profiles_protect_role")
            )

        return host

    def list_properties(self, host_id: uuid.UUID) -> list[HostPropertyListRow]:
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
                  p.updated_at
                from public.properties p
                where p.host_id = :host_id
                  and p.deleted_at is null
                order by p.updated_at desc
                """
            ),
            {"host_id": host_id},
        ).mappings()

        return [
            HostPropertyListRow(
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
            )
            for row in rows
        ]

    def property_belongs_to_host(self, host_id: uuid.UUID, property_id: uuid.UUID) -> bool:
        return bool(
            self._db.scalar(
                select(
                    select(1)
                    .select_from(Properties)
                    .where(
                        Properties.id == property_id,
                        Properties.host_id == host_id,
                        Properties.deleted_at.is_(None),
                    )
                    .exists()
                )
            )
        )

    def list_bookings(self, host_id: uuid.UUID) -> list[HostBookingRow]:
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
                where p.host_id = :host_id
                order by b.created_at desc
                """
            ),
            {"host_id": host_id},
        ).mappings()

        return [
            HostBookingRow(
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

    def get_profile_full_name(self, profile_id: uuid.UUID) -> str | None:
        return self._db.scalar(
            select(Profiles.full_name).where(
                Profiles.id == profile_id,
                Profiles.deleted_at.is_(None),
            )
        )
