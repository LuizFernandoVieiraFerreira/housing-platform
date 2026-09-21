package com.housingplatform.persistence.entity.support;

import com.housingplatform.persistence.entity.Booking;
import com.housingplatform.persistence.entity.BookingPriceSnapshot;
import com.housingplatform.persistence.entity.Profile;
import com.housingplatform.persistence.entity.Property;
import com.housingplatform.persistence.entity.Room;
import com.housingplatform.persistence.enums.BookingStatus;
import com.housingplatform.persistence.enums.BookingType;
import java.lang.reflect.Field;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Map;
import java.util.UUID;

public final class BookingFactory {

  private BookingFactory() {}

  public static Booking newHold(
      Profile customer,
      Room room,
      Property property,
      LocalDate checkIn,
      LocalDate checkOut,
      int guestCount,
      BookingStatus status,
      BookingType bookingType,
      OffsetDateTime holdExpiresAt,
      String customerNotes) {
    Booking booking = newBooking();
    setField(booking, "customer", customer);
    setField(booking, "room", room);
    setField(booking, "property", property);
    setField(booking, "checkIn", checkIn);
    setField(booking, "checkOut", checkOut);
    setField(booking, "guestCount", guestCount);
    setField(booking, "status", status);
    setField(booking, "bookingType", bookingType);
    setField(booking, "holdExpiresAt", holdExpiresAt);
    setField(booking, "customerNotes", customerNotes);
    setField(booking, "paymentRetryCount", 0);
    OffsetDateTime now = OffsetDateTime.now(ZoneOffset.UTC);
    setField(booking, "createdAt", now);
    setField(booking, "updatedAt", now);
    return booking;
  }

  public static BookingPriceSnapshot newPriceSnapshot(
      Booking booking,
      int rentKrw,
      int serviceFeeKrw,
      int totalKrw,
      String pricingVersion,
      List<Map<String, Object>> nightlyBreakdown) {
    BookingPriceSnapshot snapshot = newSnapshot();
    setField(snapshot, "booking", booking);
    setField(snapshot, "rentKrw", rentKrw);
    setField(snapshot, "serviceFeeKrw", serviceFeeKrw);
    setField(snapshot, "utilitiesKrw", 0);
    setField(snapshot, "totalKrw", totalKrw);
    setField(snapshot, "pricingVersion", pricingVersion);
    setField(snapshot, "nightlyBreakdown", nightlyBreakdown);
    setField(snapshot, "createdAt", OffsetDateTime.now(ZoneOffset.UTC));
    return snapshot;
  }

  private static Booking newBooking() {
    try {
      var constructor = Booking.class.getDeclaredConstructor();
      constructor.setAccessible(true);
      return constructor.newInstance();
    } catch (ReflectiveOperationException exception) {
      throw new IllegalStateException("Unable to create booking entity", exception);
    }
  }

  private static BookingPriceSnapshot newSnapshot() {
    try {
      var constructor = BookingPriceSnapshot.class.getDeclaredConstructor();
      constructor.setAccessible(true);
      return constructor.newInstance();
    } catch (ReflectiveOperationException exception) {
      throw new IllegalStateException("Unable to create booking price snapshot", exception);
    }
  }

  private static void setField(Object target, String fieldName, Object value) {
    try {
      Field field = target.getClass().getDeclaredField(fieldName);
      field.setAccessible(true);
      field.set(target, value);
    } catch (ReflectiveOperationException exception) {
      throw new IllegalStateException("Unable to set " + fieldName, exception);
    }
  }
}
