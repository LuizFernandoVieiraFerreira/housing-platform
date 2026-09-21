package com.housingplatform.notifications;

import com.housingplatform.persistence.entity.Notification;
import jakarta.persistence.EntityManager;
import jakarta.persistence.NoResultException;
import jakarta.persistence.PersistenceContext;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.stereotype.Repository;

@Repository
public class NotificationRepository {

  private static final int LIST_LIMIT = 50;

  @PersistenceContext private EntityManager entityManager;

  public List<Notification> listForUser(UUID userId) {
    return entityManager
        .createQuery(
            """
            select n from Notification n
            where n.userId = :userId
            order by n.createdAt desc
            """,
            Notification.class)
        .setParameter("userId", userId)
        .setMaxResults(LIST_LIMIT)
        .getResultList();
  }

  public int countUnread(UUID userId) {
    Number count =
        (Number)
            entityManager
                .createQuery(
                    """
                    select count(n) from Notification n
                    where n.userId = :userId and n.readAt is null
                    """)
                .setParameter("userId", userId)
                .getSingleResult();
    return count.intValue();
  }

  public Optional<Notification> markRead(UUID userId, UUID notificationId) {
    OffsetDateTime now = OffsetDateTime.now(ZoneOffset.UTC);
    int updated =
        entityManager
            .createNativeQuery(
                """
                update public.notifications
                set read_at = :readAt
                where id = :notificationId
                  and user_id = :userId
                  and read_at is null
                """)
            .setParameter("readAt", now)
            .setParameter("notificationId", notificationId)
            .setParameter("userId", userId)
            .executeUpdate();

    if (updated > 0) {
      entityManager.flush();
      return findById(notificationId, userId);
    }

    return findById(notificationId, userId);
  }

  public int markAllRead(UUID userId) {
    OffsetDateTime now = OffsetDateTime.now(ZoneOffset.UTC);
    int updated =
        entityManager
            .createNativeQuery(
                """
                update public.notifications
                set read_at = :readAt
                where user_id = :userId and read_at is null
                """)
            .setParameter("readAt", now)
            .setParameter("userId", userId)
            .executeUpdate();
    entityManager.flush();
    return updated;
  }

  private Optional<Notification> findById(UUID notificationId, UUID userId) {
    return entityManager
        .createQuery(
            """
            select n from Notification n
            where n.id = :notificationId and n.userId = :userId
            """,
            Notification.class)
        .setParameter("notificationId", notificationId)
        .setParameter("userId", userId)
        .getResultStream()
        .findFirst();
  }
}
