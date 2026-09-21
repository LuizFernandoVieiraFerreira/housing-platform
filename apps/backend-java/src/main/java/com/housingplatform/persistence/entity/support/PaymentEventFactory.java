package com.housingplatform.persistence.entity.support;

import com.housingplatform.persistence.entity.Booking;
import com.housingplatform.persistence.entity.Payment;
import com.housingplatform.persistence.entity.PaymentEvent;
import java.lang.reflect.Field;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.Map;

public final class PaymentEventFactory {

  private PaymentEventFactory() {}

  public static PaymentEvent create(
      String eventId,
      Payment payment,
      Booking booking,
      String eventType,
      Map<String, Object> payload) {
    PaymentEvent event = newEvent();
    setField(event, "eventId", eventId);
    setField(event, "payment", payment);
    setField(event, "booking", booking);
    setField(event, "eventType", eventType);
    setField(event, "payload", payload);
    setField(event, "processedAt", OffsetDateTime.now(ZoneOffset.UTC));
    return event;
  }

  private static PaymentEvent newEvent() {
    try {
      var constructor = PaymentEvent.class.getDeclaredConstructor();
      constructor.setAccessible(true);
      return constructor.newInstance();
    } catch (ReflectiveOperationException exception) {
      throw new IllegalStateException("Unable to create payment event entity", exception);
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
