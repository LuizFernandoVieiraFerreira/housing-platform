package com.housingplatform.persistence.repository;

import com.housingplatform.persistence.entity.Notification;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface NotificationRepository extends JpaRepository<Notification, UUID> {

  List<Notification> findTop50ByUserIdOrderByCreatedAtDesc(UUID userId);

  long countByUserIdAndReadAtIsNull(UUID userId);

  Optional<Notification> findByIdAndUserId(UUID id, UUID userId);

  @Modifying(clearAutomatically = true, flushAutomatically = true)
  @Query(
      """
      UPDATE Notification n
      SET n.readAt = CURRENT_TIMESTAMP
      WHERE n.id = :notificationId AND n.userId = :userId AND n.readAt IS NULL
      """)
  int markRead(@Param("userId") UUID userId, @Param("notificationId") UUID notificationId);

  @Modifying(clearAutomatically = true, flushAutomatically = true)
  @Query(
      """
      UPDATE Notification n
      SET n.readAt = CURRENT_TIMESTAMP
      WHERE n.userId = :userId AND n.readAt IS NULL
      """)
  int markAllRead(@Param("userId") UUID userId);
}
