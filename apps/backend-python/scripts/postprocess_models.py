"""Post-process sqlacodegen output into committed ORM models.

Run via scripts/regenerate-models.sh after `pnpm db:reset`.
"""

from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
GENERATED = ROOT / "src/housing_platform/db/models_generated.py"
OUTPUT = ROOT / "src/housing_platform/db/models.py"

HEADER = '''\
"""SQLAlchemy models reflecting the Supabase `public` schema.

Generated from the migrated database via sqlacodegen, then post-processed.
Do not run Alembic or MetaData.create_all() — Supabase migrations own DDL.

Regenerate: ./scripts/regenerate-models.sh
"""

'''

REMOVALS = [
    "class Users(Base):",
    "class Profiles(Users):",
    "class PropertySearchEmbeddings(Properties):",
    "class BookingPriceSnapshots(Bookings):",
]

REPLACEMENTS = [
    ("class Profiles(Users):", "class Profiles(Base):"),
    ("class PropertySearchEmbeddings(Properties):", "class PropertySearchEmbeddings(Base):"),
    ("class BookingPriceSnapshots(Bookings):", "class BookingPriceSnapshots(Base):"),
    (
        "ForeignKeyConstraint(['id'], ['auth.users.id'], ondelete='CASCADE', name='profiles_id_fkey'),",
        "# profiles.id references auth.users; no ORM mapping to auth schema",
    ),
    (
        "Enum('customer', 'host', 'admin', name='user_role')",
        "Enum('customer', 'host', 'admin', name='user_role', create_type=False)",
    ),
    (
        "Enum('pending', 'active', 'suspended', name='host_status')",
        "Enum('pending', 'active', 'suspended', name='host_status', create_type=False)",
    ),
    (
        "Enum('new', 'in_progress', 'closed', name='housing_request_status')",
        "Enum('new', 'in_progress', 'closed', name='housing_request_status', create_type=False)",
    ),
    (
        "Enum('booking_request', 'booking_confirmed', 'booking_rejected', name='notification_type')",
        "Enum('booking_request', 'booking_confirmed', 'booking_rejected', name='notification_type', create_type=False)",
    ),
    (
        "Enum('share-house', 'studio', 'micro-studio', 'multi-bedroom', name='accommodation_type')",
        "Enum('share-house', 'studio', 'micro-studio', 'multi-bedroom', name='accommodation_type', create_type=False)",
    ),
    (
        "Enum('draft', 'pending_review', 'published', 'archived', name='property_status')",
        "Enum('draft', 'pending_review', 'published', 'archived', name='property_status', create_type=False)",
    ),
    (
        "Enum('instant', 'request', name='booking_mode')",
        "Enum('instant', 'request', name='booking_mode', create_type=False)",
    ),
    (
        "Enum('pending', 'synced', 'failed', 'not_applicable', name='property_embedding_sync_status')",
        "Enum('pending', 'synced', 'failed', 'not_applicable', name='property_embedding_sync_status', create_type=False)",
    ),
    (
        "Enum('available', 'unavailable', 'archived', name='room_status')",
        "Enum('available', 'unavailable', 'archived', name='room_status', create_type=False)",
    ),
    (
        "Enum('requested', 'pending_payment', 'expired', 'confirmed', 'payment_failed', 'active', 'completed', 'cancelled', 'rejected', name='booking_status')",
        "Enum('requested', 'pending_payment', 'expired', 'confirmed', 'payment_failed', 'active', 'completed', 'cancelled', 'rejected', name='booking_status', create_type=False)",
    ),
    (
        "Enum('instant', 'request', name='booking_type')",
        "Enum('instant', 'request', name='booking_type', create_type=False)",
    ),
    (
        "Enum('pending', 'confirmed', 'failed', 'cancelled', name='payment_status')",
        "Enum('pending', 'confirmed', 'failed', 'cancelled', name='payment_status', create_type=False)",
    ),
    (
        "Geography('POINT', 4326, from_text='ST_GeogFromText', name='geography')",
        "Geography(geometry_type='POINT', srid=4326, spatial_index=False)",
    ),
    ("from pgvector.sqlalchemy.vector import VECTOR", "from pgvector.sqlalchemy import Vector"),
    ("VECTOR(1536)", "Vector(1536)"),
]


def remove_users_class(source: str) -> str:
    lines = source.splitlines(keepends=True)
    result: list[str] = []
    skip = False

    for line in lines:
        if line.startswith("class Users(Base):"):
            skip = True
            continue

        if skip:
            if line.startswith("class ") and not line.startswith("class Users"):
                skip = False
            else:
                continue

        result.append(line)

    return "".join(result)


def main() -> None:
    if not GENERATED.exists():
        raise SystemExit(f"Missing generated models: {GENERATED}")

    source = GENERATED.read_text()
    source = remove_users_class(source)

    for old, new in REPLACEMENTS:
        source = source.replace(old, new)

    # Drop duplicate GIST index declarations sqlacodegen emits for geography.
    source = source.replace("        Index('idx_properties_location', 'location'),\n", "")
    source = source.replace("        Index('properties_location_idx', 'location'),\n", "")

    # Add relationship from PropertySearchEmbeddings to Properties.
    anchor = "    updated_at: Mapped[datetime.datetime] = mapped_column(DateTime(True), nullable=False, server_default=text(\"timezone('utc'::text, now())\"))\n\n\nclass Rooms"
    replacement = (
        "    updated_at: Mapped[datetime.datetime] = mapped_column(DateTime(True), nullable=False, server_default=text(\"timezone('utc'::text, now())\"))\n\n"
        "    property_: Mapped['Properties'] = relationship('Properties', back_populates='search_embedding')\n\n\nclass Rooms"
    )
    source = source.replace(anchor, replacement)

    properties_anchor = "    bookings: Mapped[list['Bookings']] = relationship('Bookings', back_populates='property')\n\n\nt_property_amenities"
    properties_replacement = (
        "    bookings: Mapped[list['Bookings']] = relationship('Bookings', back_populates='property')\n"
        "    search_embedding: Mapped[Optional['PropertySearchEmbeddings']] = relationship(\n"
        "        'PropertySearchEmbeddings', back_populates='property_', uselist=False\n"
        "    )\n\n\nt_property_amenities"
    )
    source = source.replace(properties_anchor, properties_replacement)

    booking_snap_anchor = (
        "    created_at: Mapped[datetime.datetime] = mapped_column(DateTime(True), nullable=False, server_default=text(\"timezone('utc'::text, now())\"))\n\n\nclass Payments"
    )
    booking_snap_replacement = (
        "    created_at: Mapped[datetime.datetime] = mapped_column(DateTime(True), nullable=False, server_default=text(\"timezone('utc'::text, now())\"))\n\n"
        "    booking: Mapped['Bookings'] = relationship('Bookings', back_populates='price_snapshot')\n\n\nclass Payments"
    )
    source = source.replace(booking_snap_anchor, booking_snap_replacement)

    bookings_anchor = "    payment_events: Mapped[list['PaymentEvents']] = relationship('PaymentEvents', back_populates='booking')\n\n\nclass RoomImages"
    bookings_replacement = (
        "    payment_events: Mapped[list['PaymentEvents']] = relationship('PaymentEvents', back_populates='booking')\n"
        "    price_snapshot: Mapped[Optional['BookingPriceSnapshots']] = relationship(\n"
        "        'BookingPriceSnapshots', back_populates='booking', uselist=False\n"
        "    )\n\n\nclass RoomImages"
    )
    source = source.replace(bookings_anchor, bookings_replacement)

    # Remove stale docstring import comment block if Users removal left gaps.
    output = HEADER + source.lstrip()

    OUTPUT.write_text(output)
    print(f"Wrote {OUTPUT}")


if __name__ == "__main__":
    main()
