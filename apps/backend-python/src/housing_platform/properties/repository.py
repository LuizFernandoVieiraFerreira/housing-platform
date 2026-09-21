import uuid
from dataclasses import dataclass

from sqlalchemy import delete, func, insert, select, text
from sqlalchemy.orm import Session, selectinload

from housing_platform.db.models import (
    Amenities,
    Hosts,
    Properties,
    Rooms,
    t_property_amenities,
)
from housing_platform.properties.search_criteria import PropertySearchCriteria, SearchPropertyRow
from housing_platform.properties.search_query import execute_property_search


@dataclass(frozen=True)
class Coordinates:
    latitude: float
    longitude: float


class PropertyRepository:
    def __init__(self, db: Session) -> None:
        self._db = db

    def search(
        self,
        criteria: PropertySearchCriteria,
        *,
        limit: int,
        offset: int,
    ) -> list[SearchPropertyRow]:
        return execute_property_search(
            self._db,
            criteria,
            limit=limit,
            offset=offset,
        )

    def get_published_property(self, property_id: uuid.UUID) -> Properties | None:
        return self._db.scalar(
            select(Properties)
            .options(
                selectinload(Properties.property_images),
                selectinload(Properties.rooms),
                selectinload(Properties.host),
            )
            .where(
                Properties.id == property_id,
                Properties.status == "published",
                Properties.deleted_at.is_(None),
            )
        )

    def get_host_property(self, property_id: uuid.UUID) -> Properties | None:
        return self._db.scalar(
            select(Properties)
            .options(
                selectinload(Properties.rooms),
            )
            .where(
                Properties.id == property_id,
                Properties.deleted_at.is_(None),
            )
        )

    def get_property_amenities(self, property_id: uuid.UUID) -> list[Amenities]:
        return list(
            self._db.scalars(
                select(Amenities)
                .join(t_property_amenities, t_property_amenities.c.amenity_id == Amenities.id)
                .where(t_property_amenities.c.property_id == property_id)
                .order_by(Amenities.sort_order)
            ).all()
        )

    def get_property_amenity_ids(self, property_id: uuid.UUID) -> list[uuid.UUID]:
        return list(
            self._db.scalars(
                select(t_property_amenities.c.amenity_id).where(
                    t_property_amenities.c.property_id == property_id
                )
            ).all()
        )

    def get_published_coordinates(self, property_id: uuid.UUID) -> Coordinates | None:
        row = self._db.execute(
            text(
                """
                select
                  extensions.st_y(p.location::extensions.geometry) as latitude,
                  extensions.st_x(p.location::extensions.geometry) as longitude
                from public.properties p
                where p.id = :property_id
                  and p.deleted_at is null
                  and p.status = 'published'
                  and p.location is not null
                """
            ),
            {"property_id": property_id},
        ).mappings().first()
        if row is None:
            return None
        return Coordinates(latitude=row["latitude"], longitude=row["longitude"])

    def get_coordinates(self, property_id: uuid.UUID) -> Coordinates | None:
        row = self._db.execute(
            text(
                """
                select
                  extensions.st_y(p.location::extensions.geometry) as latitude,
                  extensions.st_x(p.location::extensions.geometry) as longitude
                from public.properties p
                where p.id = :property_id
                  and p.deleted_at is null
                  and p.location is not null
                """
            ),
            {"property_id": property_id},
        ).mappings().first()
        if row is None:
            return None
        return Coordinates(latitude=row["latitude"], longitude=row["longitude"])

    def create_property(
        self,
        *,
        host_id: uuid.UUID,
        slug: str,
        fields: dict[str, object],
    ) -> Properties:
        property_row = Properties(
            host_id=host_id,
            slug=slug,
            status="draft",
            country="KR",
            **fields,
        )
        self._db.add(property_row)
        self._db.flush()
        return property_row

    def update_property(
        self,
        property_id: uuid.UUID,
        fields: dict[str, object],
    ) -> Properties | None:
        property_row = self.get_host_property(property_id)
        if property_row is None:
            return None

        for key, value in fields.items():
            setattr(property_row, key, value)

        self._db.flush()
        return property_row

    def set_location(self, property_id: uuid.UUID, latitude: float, longitude: float) -> bool:
        updated_id = self._db.scalar(
            text(
                """
                update public.properties
                set location = extensions.st_setsrid(
                  extensions.st_makepoint(:longitude, :latitude),
                  4326
                )::extensions.geography
                where id = :property_id
                  and deleted_at is null
                  and status in ('draft', 'pending_review')
                returning id
                """
            ),
            {
                "property_id": property_id,
                "latitude": latitude,
                "longitude": longitude,
            },
        )
        return updated_id is not None

    def count_available_rooms(self, property_id: uuid.UUID) -> int:
        return self._db.scalar(
            select(func.count())
            .select_from(Rooms)
            .where(
                Rooms.property_id == property_id,
                Rooms.deleted_at.is_(None),
                Rooms.status == "available",
            )
        ) or 0

    def has_location(self, property_id: uuid.UUID) -> bool:
        return self._db.scalar(
            select(
                select(1)
                .select_from(Properties)
                .where(
                    Properties.id == property_id,
                    Properties.location.is_not(None),
                )
                .exists()
            )
        )

    def submit_for_review(self, property_id: uuid.UUID) -> Properties | None:
        updated_id = self._db.scalar(
            text(
                """
                update public.properties
                set status = 'pending_review'
                where id = :property_id
                  and deleted_at is null
                  and status = 'draft'
                returning id
                """
            ),
            {"property_id": property_id},
        )
        if updated_id is None:
            return None
        return self.get_host_property(property_id)

    def sync_amenities(self, property_id: uuid.UUID, amenity_ids: list[uuid.UUID]) -> None:
        self._db.execute(
            delete(t_property_amenities).where(t_property_amenities.c.property_id == property_id)
        )
        if not amenity_ids:
            return

        self._db.execute(
            insert(t_property_amenities),
            [{"property_id": property_id, "amenity_id": amenity_id} for amenity_id in amenity_ids],
        )

    def get_host_display_name(self, host_id: uuid.UUID) -> str:
        display_name = self._db.scalar(
            select(Hosts.display_name).where(
                Hosts.id == host_id,
                Hosts.deleted_at.is_(None),
            )
        )
        return display_name or "Host"
