from housing_platform.db.models import Base

EXPECTED_PUBLIC_TABLES = {
    "profiles",
    "hosts",
    "properties",
    "rooms",
    "property_images",
    "room_images",
    "amenities",
    "property_amenities",
    "platform_settings",
    "bookings",
    "booking_price_snapshots",
    "payments",
    "payment_events",
    "notifications",
    "housing_requests",
    "audit_logs",
    "location_aliases",
    "property_search_embeddings",
    "api_rate_limits",
}


def test_models_cover_all_public_tables() -> None:
    mapped_tables = {
        table.name
        for table in Base.metadata.tables.values()
        if table.schema == "public"
    }

    assert mapped_tables == EXPECTED_PUBLIC_TABLES
