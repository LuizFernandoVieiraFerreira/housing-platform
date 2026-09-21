package com.housingplatform.persistence;

import static org.junit.jupiter.api.Assertions.assertEquals;

import com.housingplatform.persistence.entity.Amenity;
import com.housingplatform.persistence.entity.ApiRateLimit;
import com.housingplatform.persistence.entity.AuditLog;
import com.housingplatform.persistence.entity.Booking;
import com.housingplatform.persistence.entity.BookingPriceSnapshot;
import com.housingplatform.persistence.entity.Host;
import com.housingplatform.persistence.entity.HousingRequest;
import com.housingplatform.persistence.entity.LocationAlias;
import com.housingplatform.persistence.entity.Notification;
import com.housingplatform.persistence.entity.Payment;
import com.housingplatform.persistence.entity.PaymentEvent;
import com.housingplatform.persistence.entity.PlatformSetting;
import com.housingplatform.persistence.entity.Profile;
import com.housingplatform.persistence.entity.Property;
import com.housingplatform.persistence.entity.PropertyAmenity;
import com.housingplatform.persistence.entity.PropertyImage;
import com.housingplatform.persistence.entity.PropertySearchEmbedding;
import com.housingplatform.persistence.entity.Room;
import com.housingplatform.persistence.entity.RoomImage;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.util.Set;
import java.util.stream.Stream;
import org.junit.jupiter.api.Test;

class EntityCoverageTest {

  private static final Set<String> EXPECTED_PUBLIC_TABLES =
      Set.of(
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
          "api_rate_limits");

  private static final Class<?>[] ENTITY_CLASSES = {
    Profile.class,
    Host.class,
    Property.class,
    Room.class,
    PropertyImage.class,
    RoomImage.class,
    Amenity.class,
    PropertyAmenity.class,
    PlatformSetting.class,
    Booking.class,
    BookingPriceSnapshot.class,
    Payment.class,
    PaymentEvent.class,
    Notification.class,
    HousingRequest.class,
    AuditLog.class,
    LocationAlias.class,
    PropertySearchEmbedding.class,
    ApiRateLimit.class
  };

  @Test
  void entitiesCoverAllPublicTables() {
    Set<String> mappedTables =
        Stream.of(ENTITY_CLASSES)
            .filter(type -> type.isAnnotationPresent(Entity.class))
            .map(EntityCoverageTest::tableName)
            .collect(java.util.stream.Collectors.toSet());

    assertEquals(EXPECTED_PUBLIC_TABLES, mappedTables);
  }

  private static String tableName(Class<?> entityClass) {
    Table table = entityClass.getAnnotation(Table.class);
    if (table == null) {
      throw new IllegalStateException("Missing @Table on " + entityClass.getName());
    }
    return table.name();
  }
}
