package com.housingplatform.notifications;

import com.housingplatform.auth.error.NotFoundException;
import com.housingplatform.auth.model.AuthenticatedUser;
import com.housingplatform.notifications.dto.MarkAllNotificationsReadResult;
import com.housingplatform.notifications.dto.NotificationDto;
import com.housingplatform.notifications.dto.UnreadNotificationCount;
import com.housingplatform.notifications.mapper.NotificationMapper;
import com.housingplatform.persistence.repository.NotificationRepository;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class NotificationService {

  private final NotificationRepository notificationRepository;

  public NotificationService(NotificationRepository notificationRepository) {
    this.notificationRepository = notificationRepository;
  }

  @Transactional(readOnly = true)
  public List<NotificationDto> listNotifications(AuthenticatedUser user) {
    return notificationRepository.findTop50ByUserIdOrderByCreatedAtDesc(user.id()).stream()
        .map(NotificationMapper::toDto)
        .toList();
  }

  @Transactional(readOnly = true)
  public UnreadNotificationCount getUnreadCount(AuthenticatedUser user) {
    return new UnreadNotificationCount(
        Math.toIntExact(notificationRepository.countByUserIdAndReadAtIsNull(user.id())));
  }

  @Transactional
  public NotificationDto markRead(AuthenticatedUser user, UUID notificationId) {
    notificationRepository.markRead(user.id(), notificationId);
    var notification =
        notificationRepository
            .findByIdAndUserId(notificationId, user.id())
            .orElseThrow(() -> new NotFoundException("Notification not found"));
    return NotificationMapper.toDto(notification);
  }

  @Transactional
  public MarkAllNotificationsReadResult markAllRead(AuthenticatedUser user) {
    int updatedCount = notificationRepository.markAllRead(user.id());
    return new MarkAllNotificationsReadResult(updatedCount);
  }
}
