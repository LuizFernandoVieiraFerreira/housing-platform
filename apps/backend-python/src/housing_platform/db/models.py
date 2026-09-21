"""SQLAlchemy models reflecting the Supabase `public` schema.

Generated from the migrated database via sqlacodegen, then post-processed.
Do not run Alembic or MetaData.create_all() — Supabase migrations own DDL.

Regenerate: ./scripts/regenerate-models.sh
"""

import datetime
import decimal
import uuid
from typing import Any, Optional

from geoalchemy2.types import Geography
from pgvector.sqlalchemy import Vector
from sqlalchemy import (
    ARRAY,
    Boolean,
    CheckConstraint,
    Column,
    Date,
    DateTime,
    Double,
    Enum,
    ForeignKeyConstraint,
    Index,
    Integer,
    Numeric,
    PrimaryKeyConstraint,
    SmallInteger,
    Table,
    Text,
    UniqueConstraint,
    Uuid,
    text,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    pass


class Amenities(Base):
    __tablename__ = 'amenities'
    __table_args__ = (
        CheckConstraint('char_length(TRIM(BOTH FROM name)) > 0', name='amenities_name_not_blank'),
        CheckConstraint('char_length(TRIM(BOTH FROM slug)) > 0', name='amenities_slug_not_blank'),
        PrimaryKeyConstraint('id', name='amenities_pkey'),
        UniqueConstraint('slug', name='amenities_slug_key'),
        {'schema': 'public'}
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, server_default=text('gen_random_uuid()'))
    slug: Mapped[str] = mapped_column(Text, nullable=False)
    name: Mapped[str] = mapped_column(Text, nullable=False)
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, server_default=text('0'))
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime(True), nullable=False, server_default=text("timezone('utc'::text, now())"))
    icon: Mapped[str | None] = mapped_column(Text)

    property: Mapped[list['Properties']] = relationship('Properties', secondary='public.property_amenities', back_populates='amenity')


class ApiRateLimits(Base):
    __tablename__ = 'api_rate_limits'
    __table_args__ = (
        CheckConstraint('request_count >= 0', name='api_rate_limits_request_count_non_negative'),
        PrimaryKeyConstraint('bucket', 'window_start', name='api_rate_limits_pkey'),
        Index('api_rate_limits_window_start_idx', 'window_start'),
        {'schema': 'public'}
    )

    bucket: Mapped[str] = mapped_column(Text, primary_key=True)
    window_start: Mapped[datetime.datetime] = mapped_column(DateTime(True), primary_key=True)
    request_count: Mapped[int] = mapped_column(Integer, nullable=False, server_default=text('0'))


class LocationAliases(Base):
    __tablename__ = 'location_aliases'
    __table_args__ = (
        CheckConstraint("center_lat >= '-90'::integer::double precision AND center_lat <= 90::double precision", name='location_aliases_center_lat_range'),
        CheckConstraint("center_lng >= '-180'::integer::double precision AND center_lng <= 180::double precision", name='location_aliases_center_lng_range'),
        CheckConstraint('char_length(TRIM(BOTH FROM alias)) > 0', name='location_aliases_alias_not_blank'),
        CheckConstraint('char_length(TRIM(BOTH FROM district)) > 0', name='location_aliases_district_not_blank'),
        CheckConstraint('radius_meters > 0', name='location_aliases_radius_positive'),
        PrimaryKeyConstraint('id', name='location_aliases_pkey'),
        Index('location_aliases_alias_unique_idx', unique=True),
        Index('location_aliases_district_idx', 'district'),
        {'schema': 'public'}
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, server_default=text('gen_random_uuid()'))
    alias: Mapped[str] = mapped_column(Text, nullable=False)
    district: Mapped[str] = mapped_column(Text, nullable=False)
    center_lat: Mapped[float] = mapped_column(Double(53), nullable=False)
    center_lng: Mapped[float] = mapped_column(Double(53), nullable=False)
    radius_meters: Mapped[int] = mapped_column(Integer, nullable=False, server_default=text('2500'))
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime(True), nullable=False, server_default=text("timezone('utc'::text, now())"))


class PlatformSettings(Base):
    __tablename__ = 'platform_settings'
    __table_args__ = (
        CheckConstraint('char_length(TRIM(BOTH FROM pricing_version)) > 0', name='platform_settings_pricing_version_not_blank'),
        CheckConstraint('hold_ttl_minutes > 0', name='platform_settings_hold_ttl_positive'),
        CheckConstraint('service_fee_bps >= 0 AND service_fee_bps <= 10000', name='platform_settings_service_fee_bps_valid'),
        PrimaryKeyConstraint('id', name='platform_settings_pkey'),
        {'schema': 'public'}
    )

    id: Mapped[int] = mapped_column(SmallInteger, primary_key=True)
    service_fee_bps: Mapped[int] = mapped_column(Integer, nullable=False, server_default=text('1000'))
    hold_ttl_minutes: Mapped[int] = mapped_column(Integer, nullable=False, server_default=text('15'))
    pricing_version: Mapped[str] = mapped_column(Text, nullable=False, server_default=text("'v1'::text"))
    updated_at: Mapped[datetime.datetime] = mapped_column(DateTime(True), nullable=False, server_default=text("timezone('utc'::text, now())"))


class Profiles(Base):
    __tablename__ = 'profiles'
    __table_args__ = (
        CheckConstraint('char_length(TRIM(BOTH FROM full_name)) > 0', name='profiles_full_name_not_blank'),
        CheckConstraint('char_length(TRIM(BOTH FROM preferred_language)) > 0', name='profiles_preferred_language_not_blank'),
        # profiles.id references auth.users; no ORM mapping to auth schema
        PrimaryKeyConstraint('id', name='profiles_pkey'),
        Index('profiles_role_idx', 'role'),
        {'schema': 'public'}
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True)
    role: Mapped[str] = mapped_column(Enum('customer', 'host', 'admin', name='user_role', create_type=False), nullable=False, server_default=text("'customer'::user_role"))
    full_name: Mapped[str] = mapped_column(Text, nullable=False)
    preferred_language: Mapped[str] = mapped_column(Text, nullable=False, server_default=text("'en'::text"))
    marketing_consent: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text('false'))
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime(True), nullable=False, server_default=text("timezone('utc'::text, now())"))
    updated_at: Mapped[datetime.datetime] = mapped_column(DateTime(True), nullable=False, server_default=text("timezone('utc'::text, now())"))
    phone: Mapped[str | None] = mapped_column(Text)
    avatar_url: Mapped[str | None] = mapped_column(Text)
    deleted_at: Mapped[datetime.datetime | None] = mapped_column(DateTime(True))

    audit_logs: Mapped[list['AuditLogs']] = relationship('AuditLogs', back_populates='actor')
    hosts: Mapped['Hosts'] = relationship('Hosts', uselist=False, back_populates='profile')
    housing_requests: Mapped[list['HousingRequests']] = relationship('HousingRequests', back_populates='customer')
    notifications: Mapped[list['Notifications']] = relationship('Notifications', back_populates='user')
    bookings: Mapped[list['Bookings']] = relationship('Bookings', foreign_keys='[Bookings.approved_by]', back_populates='profiles')
    bookings_: Mapped[list['Bookings']] = relationship('Bookings', foreign_keys='[Bookings.customer_id]', back_populates='customer')
    payments: Mapped[list['Payments']] = relationship('Payments', back_populates='customer')


class AuditLogs(Base):
    __tablename__ = 'audit_logs'
    __table_args__ = (
        CheckConstraint('char_length(TRIM(BOTH FROM action)) > 0', name='audit_logs_action_not_blank'),
        CheckConstraint('char_length(TRIM(BOTH FROM entity_type)) > 0', name='audit_logs_entity_type_not_blank'),
        ForeignKeyConstraint(['actor_id'], ['public.profiles.id'], ondelete='RESTRICT', name='audit_logs_actor_id_fkey'),
        PrimaryKeyConstraint('id', name='audit_logs_pkey'),
        Index('audit_logs_created_at_idx', 'created_at'),
        Index('audit_logs_entity_idx', 'entity_type', 'entity_id'),
        {'schema': 'public'}
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, server_default=text('gen_random_uuid()'))
    actor_id: Mapped[uuid.UUID] = mapped_column(Uuid, nullable=False)
    action: Mapped[str] = mapped_column(Text, nullable=False)
    entity_type: Mapped[str] = mapped_column(Text, nullable=False)
    metadata_: Mapped[dict] = mapped_column('metadata', JSONB, nullable=False, server_default=text("'{}'::jsonb"))
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime(True), nullable=False, server_default=text("timezone('utc'::text, now())"))
    entity_id: Mapped[uuid.UUID | None] = mapped_column(Uuid)

    actor: Mapped['Profiles'] = relationship('Profiles', back_populates='audit_logs')


class Hosts(Base):
    __tablename__ = 'hosts'
    __table_args__ = (
        CheckConstraint('char_length(TRIM(BOTH FROM display_name)) > 0', name='hosts_display_name_not_blank'),
        ForeignKeyConstraint(['profile_id'], ['public.profiles.id'], ondelete='CASCADE', name='hosts_profile_id_fkey'),
        PrimaryKeyConstraint('id', name='hosts_pkey'),
        UniqueConstraint('profile_id', name='hosts_profile_id_key'),
        Index('hosts_status_idx', 'status'),
        {'schema': 'public'}
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, server_default=text('gen_random_uuid()'))
    profile_id: Mapped[uuid.UUID] = mapped_column(Uuid, nullable=False)
    display_name: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(Enum('pending', 'active', 'suspended', name='host_status', create_type=False), nullable=False, server_default=text("'pending'::host_status"))
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime(True), nullable=False, server_default=text("timezone('utc'::text, now())"))
    updated_at: Mapped[datetime.datetime] = mapped_column(DateTime(True), nullable=False, server_default=text("timezone('utc'::text, now())"))
    verified_at: Mapped[datetime.datetime | None] = mapped_column(DateTime(True))
    deleted_at: Mapped[datetime.datetime | None] = mapped_column(DateTime(True))

    profile: Mapped['Profiles'] = relationship('Profiles', back_populates='hosts')
    properties: Mapped[list['Properties']] = relationship('Properties', back_populates='host')


class HousingRequests(Base):
    __tablename__ = 'housing_requests'
    __table_args__ = (
        CheckConstraint('budget_max IS NULL OR budget_max > 0', name='housing_requests_budget_positive'),
        CheckConstraint('char_length(TRIM(BOTH FROM desired_area)) > 0', name='housing_requests_desired_area_not_blank'),
        CheckConstraint('char_length(TRIM(BOTH FROM email)) > 0', name='housing_requests_email_not_blank'),
        ForeignKeyConstraint(['customer_id'], ['public.profiles.id'], ondelete='SET NULL', name='housing_requests_customer_id_fkey'),
        PrimaryKeyConstraint('id', name='housing_requests_pkey'),
        Index('housing_requests_customer_id_idx', 'customer_id'),
        Index('housing_requests_status_idx', 'status', 'created_at'),
        {'schema': 'public'}
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, server_default=text('gen_random_uuid()'))
    email: Mapped[str] = mapped_column(Text, nullable=False)
    desired_area: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(Enum('new', 'in_progress', 'closed', name='housing_request_status', create_type=False), nullable=False, server_default=text("'new'::housing_request_status"))
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime(True), nullable=False, server_default=text("timezone('utc'::text, now())"))
    updated_at: Mapped[datetime.datetime] = mapped_column(DateTime(True), nullable=False, server_default=text("timezone('utc'::text, now())"))
    customer_id: Mapped[uuid.UUID | None] = mapped_column(Uuid)
    check_in: Mapped[datetime.date | None] = mapped_column(Date)
    check_out: Mapped[datetime.date | None] = mapped_column(Date)
    budget_max: Mapped[int | None] = mapped_column(Integer)
    accommodation_type: Mapped[str | None] = mapped_column(Enum('share-house', 'studio', 'micro-studio', 'multi-bedroom', name='accommodation_type', create_type=False))
    notes: Mapped[str | None] = mapped_column(Text)

    customer: Mapped[Optional['Profiles']] = relationship('Profiles', back_populates='housing_requests')


class Notifications(Base):
    __tablename__ = 'notifications'
    __table_args__ = (
        CheckConstraint('char_length(TRIM(BOTH FROM body)) > 0', name='notifications_body_not_blank'),
        CheckConstraint('char_length(TRIM(BOTH FROM title)) > 0', name='notifications_title_not_blank'),
        ForeignKeyConstraint(['user_id'], ['public.profiles.id'], ondelete='CASCADE', name='notifications_user_id_fkey'),
        PrimaryKeyConstraint('id', name='notifications_pkey'),
        Index('notifications_user_created_idx', 'user_id', 'created_at'),
        Index('notifications_user_unread_idx', 'user_id'),
        {'schema': 'public'}
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, server_default=text('gen_random_uuid()'))
    user_id: Mapped[uuid.UUID] = mapped_column(Uuid, nullable=False)
    type: Mapped[str] = mapped_column(Enum('booking_request', 'booking_confirmed', 'booking_rejected', name='notification_type', create_type=False), nullable=False)
    title: Mapped[str] = mapped_column(Text, nullable=False)
    body: Mapped[str] = mapped_column(Text, nullable=False)
    metadata_: Mapped[dict] = mapped_column('metadata', JSONB, nullable=False, server_default=text("'{}'::jsonb"))
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime(True), nullable=False, server_default=text("timezone('utc'::text, now())"))
    read_at: Mapped[datetime.datetime | None] = mapped_column(DateTime(True))

    user: Mapped['Profiles'] = relationship('Profiles', back_populates='notifications')


class Properties(Base):
    __tablename__ = 'properties'
    __table_args__ = (
        CheckConstraint('char_length(TRIM(BOTH FROM description)) > 0', name='properties_description_not_blank'),
        CheckConstraint('char_length(TRIM(BOTH FROM district)) > 0', name='properties_district_not_blank'),
        CheckConstraint('char_length(TRIM(BOTH FROM slug)) > 0', name='properties_slug_not_blank'),
        CheckConstraint('char_length(TRIM(BOTH FROM title)) > 0', name='properties_title_not_blank'),
        CheckConstraint('min_stay_nights > 0', name='properties_min_stay_nights_positive'),
        CheckConstraint('monthly_price_min IS NULL OR monthly_price_min > 0', name='properties_monthly_price_min_positive'),
        CheckConstraint('nearest_station_walk_min IS NULL OR nearest_station_walk_min > 0', name='properties_nearest_station_walk_min_positive'),
        ForeignKeyConstraint(['host_id'], ['public.hosts.id'], ondelete='RESTRICT', name='properties_host_id_fkey'),
        PrimaryKeyConstraint('id', name='properties_pkey'),
        Index('properties_embedding_sync_status_idx', 'embedding_sync_status', 'embedding_sync_requested_at'),
        Index('properties_featured_idx', 'is_featured', 'published_at'),
        Index('properties_search_idx'),
        Index('properties_slug_unique_idx', 'slug', unique=True),
        Index('properties_status_type_price_idx', 'status', 'property_type', 'monthly_price_min'),
        {'schema': 'public'}
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, server_default=text('gen_random_uuid()'))
    host_id: Mapped[uuid.UUID] = mapped_column(Uuid, nullable=False)
    title: Mapped[str] = mapped_column(Text, nullable=False)
    slug: Mapped[str] = mapped_column(Text, nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    property_type: Mapped[str] = mapped_column(Enum('share-house', 'studio', 'micro-studio', 'multi-bedroom', name='accommodation_type', create_type=False), nullable=False)
    address_line1: Mapped[str] = mapped_column(Text, nullable=False)
    city: Mapped[str] = mapped_column(Text, nullable=False, server_default=text("'Seoul'::text"))
    country: Mapped[str] = mapped_column(Text, nullable=False, server_default=text("'KR'::text"))
    district: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(Enum('draft', 'pending_review', 'published', 'archived', name='property_status', create_type=False), nullable=False, server_default=text("'draft'::property_status"))
    booking_mode: Mapped[str] = mapped_column(Enum('instant', 'request', name='booking_mode', create_type=False), nullable=False, server_default=text("'request'::booking_mode"))
    min_stay_nights: Mapped[int] = mapped_column(Integer, nullable=False, server_default=text('30'))
    is_featured: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text('false'))
    tags: Mapped[list[str]] = mapped_column(ARRAY(Text()), nullable=False, server_default=text("'{}'::text[]"))
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime(True), nullable=False, server_default=text("timezone('utc'::text, now())"))
    updated_at: Mapped[datetime.datetime] = mapped_column(DateTime(True), nullable=False, server_default=text("timezone('utc'::text, now())"))
    embedding_sync_attempts: Mapped[int] = mapped_column(Integer, nullable=False, server_default=text('0'))
    address_line2: Mapped[str | None] = mapped_column(Text)
    postal_code: Mapped[str | None] = mapped_column(Text)
    location: Mapped[Any | None] = mapped_column(Geography(geometry_type='POINT', srid=4326, spatial_index=False))
    nearest_station_name: Mapped[str | None] = mapped_column(Text)
    nearest_station_walk_min: Mapped[int | None] = mapped_column(Integer)
    monthly_price_min: Mapped[int | None] = mapped_column(Integer)
    published_at: Mapped[datetime.datetime | None] = mapped_column(DateTime(True))
    deleted_at: Mapped[datetime.datetime | None] = mapped_column(DateTime(True))
    embedding_sync_status: Mapped[str | None] = mapped_column(Enum('pending', 'synced', 'failed', 'not_applicable', name='property_embedding_sync_status', create_type=False))
    embedding_sync_requested_at: Mapped[datetime.datetime | None] = mapped_column(DateTime(True))
    embedding_synced_at: Mapped[datetime.datetime | None] = mapped_column(DateTime(True))
    embedding_sync_error: Mapped[str | None] = mapped_column(Text)

    amenity: Mapped[list['Amenities']] = relationship('Amenities', secondary='public.property_amenities', back_populates='property')
    host: Mapped['Hosts'] = relationship('Hosts', back_populates='properties')
    property_images: Mapped[list['PropertyImages']] = relationship('PropertyImages', back_populates='property')
    rooms: Mapped[list['Rooms']] = relationship('Rooms', back_populates='property')
    bookings: Mapped[list['Bookings']] = relationship('Bookings', back_populates='property')
    search_embedding: Mapped[Optional['PropertySearchEmbeddings']] = relationship(
        'PropertySearchEmbeddings', back_populates='property_', uselist=False
    )


t_property_amenities = Table(
    'property_amenities', Base.metadata,
    Column('property_id', Uuid, primary_key=True),
    Column('amenity_id', Uuid, primary_key=True),
    ForeignKeyConstraint(['amenity_id'], ['public.amenities.id'], ondelete='CASCADE', name='property_amenities_amenity_id_fkey'),
    ForeignKeyConstraint(['property_id'], ['public.properties.id'], ondelete='CASCADE', name='property_amenities_property_id_fkey'),
    PrimaryKeyConstraint('property_id', 'amenity_id', name='property_amenities_pkey'),
    schema='public'
)


class PropertyImages(Base):
    __tablename__ = 'property_images'
    __table_args__ = (
        CheckConstraint('char_length(TRIM(BOTH FROM storage_path)) > 0', name='property_images_storage_path_not_blank'),
        ForeignKeyConstraint(['property_id'], ['public.properties.id'], ondelete='CASCADE', name='property_images_property_id_fkey'),
        PrimaryKeyConstraint('id', name='property_images_pkey'),
        Index('property_images_one_cover_idx', 'property_id', unique=True),
        Index('property_images_property_sort_idx', 'property_id', 'sort_order'),
        {'schema': 'public'}
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, server_default=text('gen_random_uuid()'))
    property_id: Mapped[uuid.UUID] = mapped_column(Uuid, nullable=False)
    storage_path: Mapped[str] = mapped_column(Text, nullable=False)
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, server_default=text('0'))
    is_cover: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text('false'))
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime(True), nullable=False, server_default=text("timezone('utc'::text, now())"))
    alt_text: Mapped[str | None] = mapped_column(Text)

    property: Mapped['Properties'] = relationship('Properties', back_populates='property_images')


class PropertySearchEmbeddings(Base):
    __tablename__ = 'property_search_embeddings'
    __table_args__ = (
        CheckConstraint('char_length(TRIM(BOTH FROM content)) > 0', name='property_search_embeddings_content_not_blank'),
        CheckConstraint('char_length(TRIM(BOTH FROM content_hash)) > 0', name='property_search_embeddings_content_hash_not_blank'),
        ForeignKeyConstraint(['property_id'], ['public.properties.id'], ondelete='CASCADE', name='property_search_embeddings_property_id_fkey'),
        PrimaryKeyConstraint('property_id', name='property_search_embeddings_pkey'),
        Index('property_search_embeddings_embedding_hnsw_idx', 'embedding'),
        Index('property_search_embeddings_updated_at_idx', 'updated_at'),
        {'schema': 'public'}
    )

    property_id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    content_hash: Mapped[str] = mapped_column(Text, nullable=False)
    embedding: Mapped[Any] = mapped_column(Vector(1536), nullable=False)
    updated_at: Mapped[datetime.datetime] = mapped_column(DateTime(True), nullable=False, server_default=text("timezone('utc'::text, now())"))

    property_: Mapped['Properties'] = relationship('Properties', back_populates='search_embedding')


class Rooms(Base):
    __tablename__ = 'rooms'
    __table_args__ = (
        CheckConstraint('char_length(TRIM(BOTH FROM name)) > 0', name='rooms_name_not_blank'),
        CheckConstraint('max_occupancy > 0', name='rooms_max_occupancy_positive'),
        CheckConstraint('monthly_price_krw > 0', name='rooms_monthly_price_positive'),
        CheckConstraint('size_sqm IS NULL OR size_sqm > 0::numeric', name='rooms_size_sqm_positive'),
        ForeignKeyConstraint(['property_id'], ['public.properties.id'], ondelete='CASCADE', name='rooms_property_id_fkey'),
        PrimaryKeyConstraint('id', name='rooms_pkey'),
        Index('rooms_property_id_idx', 'property_id'),
        {'schema': 'public'}
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, server_default=text('gen_random_uuid()'))
    property_id: Mapped[uuid.UUID] = mapped_column(Uuid, nullable=False)
    name: Mapped[str] = mapped_column(Text, nullable=False)
    max_occupancy: Mapped[int] = mapped_column(Integer, nullable=False, server_default=text('1'))
    monthly_price_krw: Mapped[int] = mapped_column(Integer, nullable=False)
    status: Mapped[str] = mapped_column(Enum('available', 'unavailable', 'archived', name='room_status', create_type=False), nullable=False, server_default=text("'available'::room_status"))
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime(True), nullable=False, server_default=text("timezone('utc'::text, now())"))
    updated_at: Mapped[datetime.datetime] = mapped_column(DateTime(True), nullable=False, server_default=text("timezone('utc'::text, now())"))
    room_type: Mapped[str | None] = mapped_column(Text)
    size_sqm: Mapped[decimal.Decimal | None] = mapped_column(Numeric(8, 2))
    available_from: Mapped[datetime.date | None] = mapped_column(Date)
    deleted_at: Mapped[datetime.datetime | None] = mapped_column(DateTime(True))

    property: Mapped['Properties'] = relationship('Properties', back_populates='rooms')
    bookings: Mapped[list['Bookings']] = relationship('Bookings', back_populates='room')
    room_images: Mapped[list['RoomImages']] = relationship('RoomImages', back_populates='room')


class Bookings(Base):
    __tablename__ = 'bookings'
    __table_args__ = (
        CheckConstraint('check_out > check_in', name='bookings_check_out_after_check_in'),
        CheckConstraint('guest_count > 0', name='bookings_guest_count_positive'),
        CheckConstraint('payment_retry_count >= 0', name='bookings_payment_retry_count_non_negative'),
        CheckConstraint("status <> 'pending_payment'::booking_status OR hold_expires_at IS NOT NULL", name='bookings_hold_expires_when_pending'),
        ForeignKeyConstraint(['approved_by'], ['public.profiles.id'], ondelete='SET NULL', name='bookings_approved_by_fkey'),
        ForeignKeyConstraint(['customer_id'], ['public.profiles.id'], ondelete='RESTRICT', name='bookings_customer_id_fkey'),
        ForeignKeyConstraint(['property_id'], ['public.properties.id'], ondelete='RESTRICT', name='bookings_property_id_fkey'),
        ForeignKeyConstraint(['room_id'], ['public.rooms.id'], ondelete='RESTRICT', name='bookings_room_id_fkey'),
        PrimaryKeyConstraint('id', name='bookings_pkey'),
        Index('bookings_customer_status_idx', 'customer_id', 'status'),
        Index('bookings_room_dates_idx', 'room_id', 'check_in', 'check_out'),
        Index('bookings_status_hold_expires_idx', 'status', 'hold_expires_at'),
        {'schema': 'public'}
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, server_default=text('gen_random_uuid()'))
    customer_id: Mapped[uuid.UUID] = mapped_column(Uuid, nullable=False)
    room_id: Mapped[uuid.UUID] = mapped_column(Uuid, nullable=False)
    property_id: Mapped[uuid.UUID] = mapped_column(Uuid, nullable=False)
    check_in: Mapped[datetime.date] = mapped_column(Date, nullable=False)
    check_out: Mapped[datetime.date] = mapped_column(Date, nullable=False)
    guest_count: Mapped[int] = mapped_column(Integer, nullable=False)
    status: Mapped[str] = mapped_column(Enum('requested', 'pending_payment', 'expired', 'confirmed', 'payment_failed', 'active', 'completed', 'cancelled', 'rejected', name='booking_status', create_type=False), nullable=False)
    booking_type: Mapped[str] = mapped_column(Enum('instant', 'request', name='booking_type', create_type=False), nullable=False)
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime(True), nullable=False, server_default=text("timezone('utc'::text, now())"))
    updated_at: Mapped[datetime.datetime] = mapped_column(DateTime(True), nullable=False, server_default=text("timezone('utc'::text, now())"))
    payment_retry_count: Mapped[int] = mapped_column(Integer, nullable=False, server_default=text('0'))
    hold_expires_at: Mapped[datetime.datetime | None] = mapped_column(DateTime(True))
    customer_notes: Mapped[str | None] = mapped_column(Text)
    approved_at: Mapped[datetime.datetime | None] = mapped_column(DateTime(True))
    approved_by: Mapped[uuid.UUID | None] = mapped_column(Uuid)
    cancelled_at: Mapped[datetime.datetime | None] = mapped_column(DateTime(True))

    profiles: Mapped[Optional['Profiles']] = relationship('Profiles', foreign_keys=[approved_by], back_populates='bookings')
    customer: Mapped['Profiles'] = relationship('Profiles', foreign_keys=[customer_id], back_populates='bookings_')
    property: Mapped['Properties'] = relationship('Properties', back_populates='bookings')
    room: Mapped['Rooms'] = relationship('Rooms', back_populates='bookings')
    payments: Mapped[list['Payments']] = relationship('Payments', back_populates='booking')
    payment_events: Mapped[list['PaymentEvents']] = relationship('PaymentEvents', back_populates='booking')
    price_snapshot: Mapped[Optional['BookingPriceSnapshots']] = relationship(
        'BookingPriceSnapshots', back_populates='booking', uselist=False
    )


class RoomImages(Base):
    __tablename__ = 'room_images'
    __table_args__ = (
        CheckConstraint('char_length(TRIM(BOTH FROM storage_path)) > 0', name='room_images_storage_path_not_blank'),
        ForeignKeyConstraint(['room_id'], ['public.rooms.id'], ondelete='CASCADE', name='room_images_room_id_fkey'),
        PrimaryKeyConstraint('id', name='room_images_pkey'),
        Index('room_images_room_sort_idx', 'room_id', 'sort_order'),
        {'schema': 'public'}
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, server_default=text('gen_random_uuid()'))
    room_id: Mapped[uuid.UUID] = mapped_column(Uuid, nullable=False)
    storage_path: Mapped[str] = mapped_column(Text, nullable=False)
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, server_default=text('0'))
    is_cover: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text('false'))
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime(True), nullable=False, server_default=text("timezone('utc'::text, now())"))
    alt_text: Mapped[str | None] = mapped_column(Text)

    room: Mapped['Rooms'] = relationship('Rooms', back_populates='room_images')


class BookingPriceSnapshots(Base):
    __tablename__ = 'booking_price_snapshots'
    __table_args__ = (
        CheckConstraint('rent_krw > 0', name='booking_price_snapshots_rent_positive'),
        CheckConstraint('service_fee_krw >= 0', name='booking_price_snapshots_service_fee_non_negative'),
        CheckConstraint('total_krw > 0', name='booking_price_snapshots_total_positive'),
        ForeignKeyConstraint(['booking_id'], ['public.bookings.id'], ondelete='CASCADE', name='booking_price_snapshots_booking_id_fkey'),
        PrimaryKeyConstraint('booking_id', name='booking_price_snapshots_pkey'),
        {'schema': 'public'}
    )

    booking_id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True)
    rent_krw: Mapped[int] = mapped_column(Integer, nullable=False)
    service_fee_krw: Mapped[int] = mapped_column(Integer, nullable=False)
    utilities_krw: Mapped[int] = mapped_column(Integer, nullable=False, server_default=text('0'))
    total_krw: Mapped[int] = mapped_column(Integer, nullable=False)
    pricing_version: Mapped[str] = mapped_column(Text, nullable=False)
    nightly_breakdown: Mapped[dict] = mapped_column(JSONB, nullable=False, server_default=text("'[]'::jsonb"))
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime(True), nullable=False, server_default=text("timezone('utc'::text, now())"))

    booking: Mapped['Bookings'] = relationship('Bookings', back_populates='price_snapshot')


class Payments(Base):
    __tablename__ = 'payments'
    __table_args__ = (
        CheckConstraint('amount_krw > 0', name='payments_amount_positive'),
        ForeignKeyConstraint(['booking_id'], ['public.bookings.id'], ondelete='RESTRICT', name='payments_booking_id_fkey'),
        ForeignKeyConstraint(['customer_id'], ['public.profiles.id'], ondelete='RESTRICT', name='payments_customer_id_fkey'),
        PrimaryKeyConstraint('id', name='payments_pkey'),
        UniqueConstraint('order_id', name='payments_order_id_unique'),
        Index('payments_booking_id_idx', 'booking_id'),
        Index('payments_customer_id_idx', 'customer_id'),
        Index('payments_payment_key_unique_idx', 'payment_key', unique=True),
        {'schema': 'public'}
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, server_default=text('gen_random_uuid()'))
    order_id: Mapped[uuid.UUID] = mapped_column(Uuid, nullable=False)
    booking_id: Mapped[uuid.UUID] = mapped_column(Uuid, nullable=False)
    customer_id: Mapped[uuid.UUID] = mapped_column(Uuid, nullable=False)
    amount_krw: Mapped[int] = mapped_column(Integer, nullable=False)
    status: Mapped[str] = mapped_column(Enum('pending', 'confirmed', 'failed', 'cancelled', name='payment_status', create_type=False), nullable=False, server_default=text("'pending'::payment_status"))
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime(True), nullable=False, server_default=text("timezone('utc'::text, now())"))
    updated_at: Mapped[datetime.datetime] = mapped_column(DateTime(True), nullable=False, server_default=text("timezone('utc'::text, now())"))
    payment_key: Mapped[str | None] = mapped_column(Text)
    toss_response: Mapped[dict | None] = mapped_column(JSONB)
    failed_reason: Mapped[str | None] = mapped_column(Text)
    confirmed_at: Mapped[datetime.datetime | None] = mapped_column(DateTime(True))

    booking: Mapped['Bookings'] = relationship('Bookings', back_populates='payments')
    customer: Mapped['Profiles'] = relationship('Profiles', back_populates='payments')
    payment_events: Mapped[list['PaymentEvents']] = relationship('PaymentEvents', back_populates='payment')


class PaymentEvents(Base):
    __tablename__ = 'payment_events'
    __table_args__ = (
        ForeignKeyConstraint(['booking_id'], ['public.bookings.id'], ondelete='SET NULL', name='payment_events_booking_id_fkey'),
        ForeignKeyConstraint(['payment_id'], ['public.payments.id'], ondelete='SET NULL', name='payment_events_payment_id_fkey'),
        PrimaryKeyConstraint('id', name='payment_events_pkey'),
        UniqueConstraint('event_id', name='payment_events_event_id_unique'),
        {'schema': 'public'}
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, server_default=text('gen_random_uuid()'))
    event_id: Mapped[str] = mapped_column(Text, nullable=False)
    event_type: Mapped[str] = mapped_column(Text, nullable=False)
    payload: Mapped[dict] = mapped_column(JSONB, nullable=False)
    processed_at: Mapped[datetime.datetime] = mapped_column(DateTime(True), nullable=False, server_default=text("timezone('utc'::text, now())"))
    payment_id: Mapped[uuid.UUID | None] = mapped_column(Uuid)
    booking_id: Mapped[uuid.UUID | None] = mapped_column(Uuid)

    booking: Mapped[Optional['Bookings']] = relationship('Bookings', back_populates='payment_events')
    payment: Mapped[Optional['Payments']] = relationship('Payments', back_populates='payment_events')
