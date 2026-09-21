import uuid

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from housing_platform.db.models import Bookings, Hosts, Notifications, Profiles, Properties


class BookingNotificationService:
    _DATE_FORMAT = "%b %d, %Y"

    def __init__(self, db: Session) -> None:
        self._db = db

    def notify_booking_request(self, booking: Bookings) -> None:
        property_row = self._load_property(booking.property_id)
        if property_row is None or property_row.host is None:
            return

        host_profile_id = property_row.host.profile_id
        guest_name = self._guest_name(booking.customer_id)

        self._create_notification(
            user_id=host_profile_id,
            notification_type="booking_request",
            title="New booking request",
            body=(
                f"{guest_name} requested to stay at {property_row.title} "
                f"({booking.check_in.strftime(self._DATE_FORMAT)} – "
                f"{booking.check_out.strftime(self._DATE_FORMAT)})"
            ),
            metadata={"bookingId": str(booking.id)},
        )

    def notify_booking_confirmed(self, booking: Bookings) -> None:
        property_row = self._load_property(booking.property_id)
        if property_row is None:
            return

        host_name = _host_display_name(property_row.host)
        if not self._profile_exists(booking.customer_id):
            return

        self._create_notification(
            user_id=booking.customer_id,
            notification_type="booking_confirmed",
            title="Booking confirmed",
            body=(
                f"{host_name} confirmed your booking for {property_row.title}, "
                f"{booking.check_in.strftime(self._DATE_FORMAT)} – "
                f"{booking.check_out.strftime(self._DATE_FORMAT)}"
            ),
            metadata={"bookingId": str(booking.id)},
        )

    def notify_booking_rejected(self, booking: Bookings) -> None:
        property_row = self._load_property(booking.property_id)
        if property_row is None or not self._profile_exists(booking.customer_id):
            return

        self._create_notification(
            user_id=booking.customer_id,
            notification_type="booking_rejected",
            title="Booking request declined",
            body=(
                f"Your request to stay at {property_row.title} "
                f"({booking.check_in.strftime(self._DATE_FORMAT)} – "
                f"{booking.check_out.strftime(self._DATE_FORMAT)}) was declined"
            ),
            metadata={"bookingId": str(booking.id)},
        )

    def _load_property(self, property_id: uuid.UUID) -> Properties | None:
        return self._db.scalar(
            select(Properties)
            .options(selectinload(Properties.host).selectinload(Hosts.profile))
            .where(Properties.id == property_id)
        )

    def _guest_name(self, customer_id: uuid.UUID) -> str:
        profile = self._db.scalar(
            select(Profiles).where(
                Profiles.id == customer_id,
                Profiles.deleted_at.is_(None),
            )
        )
        if profile is None:
            return "A guest"
        name = profile.full_name.strip()
        return name if name else "A guest"

    def _profile_exists(self, profile_id: uuid.UUID) -> bool:
        return (
            self._db.scalar(
                select(Profiles.id).where(
                    Profiles.id == profile_id,
                    Profiles.deleted_at.is_(None),
                )
            )
            is not None
        )

    def _create_notification(
        self,
        *,
        user_id: uuid.UUID,
        notification_type: str,
        title: str,
        body: str,
        metadata: dict[str, str],
    ) -> None:
        self._db.add(
            Notifications(
                user_id=user_id,
                type=notification_type,
                title=title,
                body=body,
                metadata_=metadata,
            )
        )


def _host_display_name(host: Hosts | None) -> str:
    if host is None or not host.display_name:
        return "Your host"
    name = host.display_name.strip()
    return name if name else "Your host"
