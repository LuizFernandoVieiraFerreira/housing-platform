package com.housingplatform.persistence.entity.support;

import com.housingplatform.persistence.entity.Notification;
import com.housingplatform.persistence.entity.Profile;
import com.housingplatform.persistence.enums.NotificationType;
import java.lang.reflect.Field;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.Map;

public final class NotificationFactory {

  private NotificationFactory() {}

  public static Notification create(
      Profile user,
      NotificationType type,
      String title,
      String body,
      Map<String, Object> metadata) {
    Notification notification = newNotification();
    setField(notification, "user", user);
    setField(notification, "type", type);
    setField(notification, "title", title);
    setField(notification, "body", body);
    setField(notification, "metadata", metadata == null ? Map.of() : metadata);
    OffsetDateTime now = OffsetDateTime.now(ZoneOffset.UTC);
    setField(notification, "createdAt", now);
    return notification;
  }

  private static Notification newNotification() {
    try {
      var constructor = Notification.class.getDeclaredConstructor();
      constructor.setAccessible(true);
      return constructor.newInstance();
    } catch (ReflectiveOperationException exception) {
      throw new IllegalStateException("Unable to create notification entity", exception);
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
