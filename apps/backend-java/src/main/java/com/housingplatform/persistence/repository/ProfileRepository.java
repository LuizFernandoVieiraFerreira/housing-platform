package com.housingplatform.persistence.repository;

import com.housingplatform.persistence.entity.Profile;
import com.housingplatform.persistence.enums.UserRole;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ProfileRepository extends JpaRepository<Profile, UUID> {

  @Query("SELECT p FROM Profile p WHERE p.id = :id AND p.deletedAt IS NULL")
  Optional<Profile> findActiveById(@Param("id") UUID id);

  default Optional<Profile> findActiveProfile(UUID profileId) {
    return findActiveById(profileId);
  }

  @Query(
      """
      SELECT CASE WHEN COUNT(p) > 0 THEN true ELSE false END
      FROM Profile p
      WHERE p.id = :id AND p.role = :role AND p.deletedAt IS NULL
      """)
  boolean existsActiveByIdAndRole(@Param("id") UUID id, @Param("role") UserRole role);

  @Modifying(clearAutomatically = true, flushAutomatically = true)
  @Query(
      """
      UPDATE Profile p
      SET p.fullName = :fullName,
          p.phone = :phone,
          p.preferredLanguage = :preferredLanguage,
          p.marketingConsent = :marketingConsent,
          p.avatarUrl = :avatarUrl,
          p.updatedAt = CURRENT_TIMESTAMP
      WHERE p.id = :profileId AND p.deletedAt IS NULL
      """)
  int updateActiveProfile(
      @Param("profileId") UUID profileId,
      @Param("fullName") String fullName,
      @Param("phone") String phone,
      @Param("preferredLanguage") String preferredLanguage,
      @Param("marketingConsent") boolean marketingConsent,
      @Param("avatarUrl") String avatarUrl);
}
