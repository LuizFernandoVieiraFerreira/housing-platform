package com.housingplatform.features.notifications;

import com.housingplatform.shared.auth.AuthSupport;
import com.housingplatform.features.notifications.dto.MarkAllNotificationsReadResult;
import com.housingplatform.features.notifications.dto.NotificationDto;
import com.housingplatform.features.notifications.dto.UnreadNotificationCount;
import java.util.List;
import java.util.UUID;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("${housing-platform.api-prefix}/notifications")
public class NotificationController {

  private final NotificationService notificationService;

  public NotificationController(NotificationService notificationService) {
    this.notificationService = notificationService;
  }

  @GetMapping
  public List<NotificationDto> listNotifications() {
    return notificationService.listNotifications(AuthSupport.requireCurrentUser());
  }

  @GetMapping("/unread-count")
  public UnreadNotificationCount getUnreadNotificationCount() {
    return notificationService.getUnreadCount(AuthSupport.requireCurrentUser());
  }

  @PostMapping("/{notificationId}/read")
  public NotificationDto markNotificationRead(@PathVariable UUID notificationId) {
    return notificationService.markRead(AuthSupport.requireCurrentUser(), notificationId);
  }

  @PostMapping("/read-all")
  public MarkAllNotificationsReadResult markAllNotificationsRead() {
    return notificationService.markAllRead(AuthSupport.requireCurrentUser());
  }
}
