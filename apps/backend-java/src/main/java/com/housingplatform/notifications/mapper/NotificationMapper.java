package com.housingplatform.notifications.mapper;

import com.housingplatform.notifications.dto.NotificationDto;
import com.housingplatform.persistence.entity.Notification;
import java.util.Map;

public final class NotificationMapper {

  private NotificationMapper() {}

  public static NotificationDto toDto(Notification notification) {
    Map<String, Object> metadata = notification.getMetadata();
    return new NotificationDto(
        notification.getId(),
        notification.getUserId(),
        notification.getType(),
        notification.getTitle(),
        notification.getBody(),
        metadata == null ? Map.of() : metadata,
        notification.getReadAt(),
        notification.getCreatedAt());
  }
}
