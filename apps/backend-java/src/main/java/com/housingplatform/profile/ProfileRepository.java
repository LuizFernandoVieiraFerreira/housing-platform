package com.housingplatform.profile;

import com.housingplatform.persistence.entity.Profile;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import java.util.Optional;
import java.util.UUID;
import org.springframework.stereotype.Repository;

@Repository
public class ProfileRepository {

  @PersistenceContext private EntityManager entityManager;

  public Optional<Profile> findById(UUID profileId) {
    return Optional.ofNullable(
        entityManager
            .createQuery(
                """
                select p from Profile p
                where p.id = :profileId and p.deletedAt is null
                """,
                Profile.class)
            .setParameter("profileId", profileId)
            .getResultStream()
            .findFirst()
            .orElse(null));
  }

  public Profile update(
      UUID profileId,
      String fullName,
      String phone,
      String preferredLanguage,
      boolean marketingConsent,
      String avatarUrl) {
    int updated =
        entityManager
            .createNativeQuery(
                """
                update public.profiles
                set full_name = :fullName,
                    phone = :phone,
                    preferred_language = :preferredLanguage,
                    marketing_consent = :marketingConsent,
                    avatar_url = :avatarUrl,
                    updated_at = timezone('utc', now())
                where id = :profileId and deleted_at is null
                """)
            .setParameter("fullName", fullName)
            .setParameter("phone", phone)
            .setParameter("preferredLanguage", preferredLanguage)
            .setParameter("marketingConsent", marketingConsent)
            .setParameter("avatarUrl", avatarUrl)
            .setParameter("profileId", profileId)
            .executeUpdate();
    if (updated == 0) {
      return null;
    }
    return findById(profileId).orElse(null);
  }
}
